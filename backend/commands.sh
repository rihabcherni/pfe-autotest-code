TARGET_URL="$1"
HOSTNAME="$2"
TOOL="$3"
USERNAME="$4"
PASSWORD="$5"
COOKIE="$6"
RESULTS_DIR="$7"

AUTH_ARG=""
COOKIE_ARG=""

case "$TOOL" in
  nikto)
    echo "[+] Running Nikto scan..."
    
    EXTRA_ARGS=""
    [[ -n "$USERNAME" && -n "$PASSWORD" ]] && EXTRA_ARGS=" -id $USERNAME:$PASSWORD"
    [[ -n "$COOKIE" ]] && EXTRA_ARGS=" -O STATIC-COOKIE=$COOKIE"
    
    docker exec nikto_container nikto -h "$TARGET_URL" -C all $EXTRA_ARGS \
      -o "$RESULTS_DIR/nikto_$(basename "$TARGET_URL").json" -Format json
    ;;
  
  nmap)
    echo "[+] Running Nmap scan..."
    docker exec nmap_container nmap -n -p- --script vuln "$HOSTNAME"  -oX "$RESULTS_DIR" 
    ;;
  nuclei)
    echo "[+] Running Nuclei scan..."
    docker exec nuclei_container nuclei -u "$TARGET_URL" \
      -json-export "$RESULTS_DIR/nuclei_$(basename $TARGET_URL).json"
    ;;
  
  sqlmap)
    echo "[+] Running SQLMap scan..."
    EXTRA_ARGS=""
    [[ -n "$USERNAME" && -n "$PASSWORD" ]] && EXTRA_ARGS=" --auth-type Basic --auth-cred=$USERNAME:$PASSWORD"
    [[ -n "$COOKIE" ]] && EXTRA_ARGS=" --cookie=$COOKIE"
    
    docker run --rm parrotsec/sqlmap \
      --mount type=bind,source=$RESULTS_DIR,target=/mnt/results \
      -u "$TARGET_URL" $EXTRA_ARGS \
      --batch --level=2 --risk=2 --random-agent \
      --crawl=2 \
      --answers="already=N,follow=Y,crawl=Y,sitemap=Y,skip=N" \
      --threads=5 --technique="BEUSTQ" --flush-session \
      --output-dir=/mnt/results
    ;;
  wapiti)
   echo "[+] Running wapiti scan..."
    EXTRA_ARGS=""
    [[ -n "$USERNAME" && -n "$PASSWORD" ]] && EXTRA_ARGS=" --auth-user $USERNAME --auth-password $PASSWORD --auth-method basic"
    [[ -n "$COOKIE" ]] && EXTRA_ARGS=" --cookie-value $COOKIE"
    
    docker exec wapiti_container wapiti \
      -u "$TARGET_URL" $EXTRA_ARGS \
      -m all -f json -o $RESULTS_DIR
    ;;
  whatweb)
    echo "[+] Running Whatweb scan..."
    EXTRA_ARGS=""
    [[ -n "$USERNAME" && -n "$PASSWORD" ]] && EXTRA_ARGS+=" --user=$USERNAME:$PASSWORD"
    [[ -n "$COOKIE" ]] && EXTRA_ARGS+=" --cookie $COOKIE"
    docker run --rm secsi/whatweb -a 3 $EXTRA_ARGS --log-json=/dev/stdout "$TARGET_URL" > "$RESULTS_DIR"
  ;;
  pwnxss)
    echo "[+] Running Pwnxss scan..."
    EXTRA_ARGS=""
    [[ -n "$COOKIE" ]] && EXTRA_ARGS+=" --cookie $COOKIE"
    TOOL_PATH="./tools/PwnXSS/pwnxss.py"
    DEPTH_CRAWL="2"                          
    PYTHONIOENCODING=utf-8 python3 "$TOOL_PATH" -u "$TARGET_URL" --depth "$DEPTH_CRAWL" \
      > "$RESULTS_DIR/custompython_$(basename "$TARGET_URL").json"
  ;;
  *)
    echo "[✗] Unknown tool: $TOOL"
    exit 1
    ;;
esac
echo "[✓] $TOOL scan completed for $TARGET_URL."