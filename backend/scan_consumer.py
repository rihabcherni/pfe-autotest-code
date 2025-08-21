import time
import pika
import json
import threading
import os
from concurrent.futures import ThreadPoolExecutor

from app.services.pentesting_tests.scan_functions.scan_thread import ThreadScan
from app.database.database import get_session
from app.configuration.configuration_manager import slack_configurator, jira_configurator, email_configurator

MAX_WORKERS = 3
executor = ThreadPoolExecutor(max_workers=MAX_WORKERS)
scans_running = {}

try:
    with open("setting.json") as setting_file:
        setting = json.load(setting_file)
except FileNotFoundError:
    print("⚠️  Fichier setting.json non trouvé, utilisation des paramètres par défaut")
    setting = {}

def connect_to_rabbitmq(max_retries=10, delay=5):
    rabbitmq_host = os.getenv('RABBITMQ_HOST', 'localhost')
    rabbitmq_user = os.getenv('RABBITMQ_USER', 'user')
    rabbitmq_pass = os.getenv('RABBITMQ_PASS', 'pass')
    rabbitmq_port = int(os.getenv('RABBITMQ_PORT', '5672'))
    
    print(f"🔍 Tentative de connexion à RabbitMQ: {rabbitmq_host}:{rabbitmq_port}")
    print(f"   Utilisateur: {rabbitmq_user}")
    
    for i in range(max_retries):
        try:
            credentials = pika.PlainCredentials(rabbitmq_user, rabbitmq_pass)
            parameters = pika.ConnectionParameters(
                host=rabbitmq_host, 
                port=rabbitmq_port, 
                credentials=credentials,
                heartbeat=600,
                blocked_connection_timeout=300,
                # Add connection timeout
                socket_timeout=10,
                connection_attempts=3,
                retry_delay=2
            )
            connection = pika.BlockingConnection(parameters)
            print(f"✅ Connexion RabbitMQ réussie sur {rabbitmq_host}:{rabbitmq_port}")
            return connection
        except pika.exceptions.AMQPConnectionError as e:
            print(f"❌ Connexion échouée à RabbitMQ ({rabbitmq_host}:{rabbitmq_port}). Tentative {i + 1}/{max_retries}")
            print(f"   Erreur: {e}")
            if i < max_retries - 1:
                time.sleep(delay)
        except Exception as e:
            print(f"❌ Erreur inattendue lors de la connexion RabbitMQ: {e}")
            if i < max_retries - 1:
                time.sleep(delay)
    
    raise Exception(f"⛔ Impossible de se connecter à RabbitMQ ({rabbitmq_host}:{rabbitmq_port}) après {max_retries} tentatives.")

def get_jira_config():
    return {
        "jira_email": getattr(jira_configurator, 'jira_email', None),
        "jira_token": getattr(jira_configurator, 'jira_token', None),
        "jira_domain": getattr(jira_configurator, 'jira_domain', None),
        "jira_board": getattr(jira_configurator, 'jira_board', None),
        "jira_project_key": getattr(jira_configurator, 'jira_project_key', None)
    }

def start_scan(scanner, slack_token, slack_channel_id, email_list, jira_config, db, user_id, scan_request):
    report_id = scanner.report_db_id
    thread_scan_instance = scanner

    def run_scan():
        try:
            thread_scan_instance.run_all_scans(
                slack_token,
                slack_channel_id,
                email_list,
                jira_config['jira_email'],
                jira_config['jira_token'],
                jira_config['jira_domain'],
                jira_config['jira_board'],
                jira_config['jira_project_key'],
                db,
                user_id,
                scan_request.get("username"),
                scan_request.get("password"),
                scan_request.get("token_auth"),
                scan_request.get("cookies")
            )
            print(f"✅ Scan terminé pour {scanner.url}")
        except Exception as e:
            print(f"❌ Erreur lors du scan pour {scanner.url}: {e}")
        finally:
            scans_running.pop(report_id, None)

    thread = threading.Thread(target=run_scan)
    thread.start()
    scans_running[report_id] = thread_scan_instance
    return report_id

def handle_scan(data):
    try:
        print("📩 Traitement du message:", data)

        url = data["url"]
        scan_tools = data["scan_tools"]
        user_id = data["user_id"]
        auth = data.get("auth", {})
        report_id = data.get("report_id")

        db = next(get_session())

        scanner = ThreadScan(script_dir="/scanner", setting=setting, url=url, scan_tools=scan_tools)

        if report_id:
            scanner.report_db_id = report_id
        else:
            authentification = bool(auth.get("username") or auth.get("password") or auth.get("token_auth") or auth.get("cookies"))
            scanner.create_report_entry(db, user_id, authentification)
            report_id = scanner.report_db_id

        jira_config = get_jira_config()

        start_scan(
            scanner=scanner,
            slack_token=slack_configurator.slack_token,
            slack_channel_id=slack_configurator.slack_channel_id,
            email_list=email_configurator.scan_emails,
            jira_config=jira_config,
            db=db,
            user_id=user_id,
            scan_request=auth
        )
        
    except Exception as e:
        print(f"❌ Erreur lors du traitement du message: {e}")
        import traceback
        traceback.print_exc()

def callback(ch, method, properties, body):
    try:
        data = json.loads(body)
        if len(scans_running) >= MAX_WORKERS:
            print("⏳ Tous les workers sont occupés, attente en file...")
        
        print("📥 Message reçu de RabbitMQ:", data)
        executor.submit(handle_scan, data)
        ch.basic_ack(delivery_tag=method.delivery_tag)
    except Exception as e:
        print(f"❌ Erreur lors du traitement du callback: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

def start_consuming():
    try:
        connection = connect_to_rabbitmq()
        channel = connection.channel()
        
        channel.queue_declare(queue='scan_queue', durable=True)
        channel.basic_qos(prefetch_count=MAX_WORKERS)
        channel.basic_consume(queue='scan_queue', on_message_callback=callback)
        
        print("🔄 En attente de messages dans la file 'scan_queue'...")
        print(f"📊 Nombre maximum de workers: {MAX_WORKERS}")
        
        channel.start_consuming()
        
    except KeyboardInterrupt:
        print("\n🛑 Arrêt demandé par l'utilisateur")
        try:
            channel.stop_consuming()
            connection.close()
        except:
            pass
    except Exception as e:
        print(f"❌ Erreur fatale: {e}")
        import traceback
        traceback.print_exc()
        time.sleep(5)  # Attendre avant de relancer
        start_consuming()  # Relancer automatiquement

if __name__ == "__main__":
    print("🚀 Démarrage du consumer de scans...")
    start_consuming()