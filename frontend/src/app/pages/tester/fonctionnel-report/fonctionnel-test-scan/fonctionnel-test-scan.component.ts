import { AfterViewInit, Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import Drawflow from 'drawflow';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { FunctionalReportService } from '../../../../services/functional-report/functional_report.service';
import { DrawflowExport, DrawflowNode, StepTest, TestCase, Workflow } from '../../../../models/functional-report';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';
import { AuthService } from '../../../../services/auth/auth.service';
import { NotificationService } from '../../../../services/notification/notification.service';
import { Notifications } from '../../../../models/notification';

@Component({
  selector: 'app-fonctionnel-test-scan',
  standalone: true,
  imports: [
    CommonModule, MatDividerModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './fonctionnel-test-scan.component.html',
  styleUrl: './fonctionnel-test-scan.component.css'
})
export class FonctionnelTestScanComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('drawflowContainer') drawflowContainer!: ElementRef;
  
  editor!: Drawflow;
  selectedNode: any = null;
  nodeForm: FormGroup;
  currentWorkflow: Workflow | null = null;
  workflowId!: number;
  functionalReportId!: number;
  hasStartNode = false;
  hasEndNode = false;
  testCases: TestCase[] = [];
  allSteps: StepTest[] = [];
  notifications: Notifications[] = [];
  newNotifSub?: Subscription;
  userId!: number;

  isEditingWorkflowDetails = false;
  isUpdating = false;
  workflowDetailsForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private fonctionalReportService: FunctionalReportService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.nodeForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      actionType: [''],
      selector: [''],
      url: [''],
      text: [''],
      timeout: [10, [Validators.min(1), Validators.max(300)]]
    });
    this.userId = this.authService.getUserId()!;
    this.workflowDetailsForm = this.fb.group({
      title: ['', Validators.required],
      description: ['']
    });
  }
  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const workflowIdParam = params.get('workflowId');
      const functionalReportIdParam = params.get('functionalReportId');
      if (workflowIdParam) {
        this.workflowId = +workflowIdParam;
      }
      if (functionalReportIdParam) {
        this.functionalReportId = +functionalReportIdParam;
      }
      
      if (this.workflowId) {
        this.loadWorkflowWithData(this.workflowId);
      }
      if (this.userId) {
        this.loadNotifications();
        this.connectToNotificationService();
      }    
    });
  }
  ngOnDestroy() {
    if (this.newNotifSub) {
      this.newNotifSub.unsubscribe();
    }
    this.notificationService.disconnect?.();
  }
  private loadNotifications(): void {
    this.notificationService.getNotifications(this.userId).subscribe({
      next: (notifs) => {
        this.notifications = notifs
          .filter(n => n.type === 'progression') 
          .sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        this.notifications.forEach(notification => {
          if (notification.message) {
            this.handleProgressNotification(notification.message);
          }
        });
      },
      error: (error) => {
        console.error('Erreur lors du chargement des notifications:', error);
      }
    });
  }
  private connectToNotificationService(): void {
    this.notificationService.connectToWebSocket(this.userId);
    this.newNotifSub = this.notificationService.notifications$.subscribe({
      next: (notif) => {
        if (notif.type === 'progression') { 
          this.notifications.unshift(notif);
          if (notif.message) {
            this.handleProgressNotification(notif.message);
          }
        }
      },
      error: (error) => {
        console.error('Erreur WebSocket notifications:', error);
      }
    });
  }
  private handleProgressNotification(message: string): void {
    console.log('Processing notification message:', message);  
    const stepRegex = /^Step (\d+):(\w+)\s+\((\d+)\/(\d+)\)$/; // Format: "Step 39:passed  (3/6)"
    const stepWithTitleRegex = /^Step (\d+):(\w+) (.+) \((\d+)\/(\d+)\)$/; // Format: "Step 39:passed Step Title (3/6)"
    const testCaseRegex = /^Test case (\d+):(\w+) '(.+)' \((\d+)\/(\d+)\)$/; // Format: "Test case 456:failed 'Test Case Title' (2/10)"
    const testCaseSimpleRegex = /^Test case (\d+):(\w+)\s+\((\d+)\/(\d+)\)$/; // Format: "Test case 456:failed  (2/10)"
    const workflowRegex = /^Workflow (\d+):(\w+)(?:\s+'(.+)')?$/; // Format: "Workflow 123:completed" ou "Workflow 123:completed 'Title'"

    let stepMatch = message.match(stepRegex);
    let stepWithTitleMatch = message.match(stepWithTitleRegex);
    let testCaseMatch = message.match(testCaseRegex);
    let testCaseSimpleMatch = message.match(testCaseSimpleRegex);
    let workflowMatch = message.match(workflowRegex);

    if (stepWithTitleMatch) {
      const [, id, status, title, current, total] = stepWithTitleMatch;
      console.log(`Updating step ${id} with status ${status} and title "${title}"`);
      this.updateStepStatus(parseInt(id), status, title);
    } else if (stepMatch) {
      const [, id, status, current, total] = stepMatch;
      console.log(`Updating step ${id} with status ${status} (no title provided)`);
      this.updateStepStatus(parseInt(id), status, null); 
    } else if (testCaseMatch) {
      const [, id, status, title, current, total] = testCaseMatch;
      console.log(`Updating test case ${id} with status ${status} and title "${title}"`);
      this.updateTestCaseStatus(parseInt(id), status, title);
    } else if (testCaseSimpleMatch) {
      const [, id, status, current, total] = testCaseSimpleMatch;
      console.log(`Updating test case ${id} with status ${status} (no title provided)`);
      this.updateTestCaseStatus(parseInt(id), status, null);
    } else if (workflowMatch) {
      const [, id, status, title] = workflowMatch;
      console.log(`Workflow ${id} status: ${status}${title ? ` with title "${title}"` : ''}`);
      this.updateWorkflowStatus(parseInt(id), status, title || '');
    } else {
      console.log('No matching pattern for message:', message);
      console.log('Available patterns:');
      console.log('- Step with title: Step ID:STATUS TITLE (current/total)');
      console.log('- Step simple: Step ID:STATUS  (current/total)');
      console.log('- Test case with title: Test case ID:STATUS \'TITLE\' (current/total)');
      console.log('- Test case simple: Test case ID:STATUS  (current/total)');
      console.log('- Workflow: Workflow ID:STATUS or Workflow ID:STATUS \'TITLE\'');
    }
  }
  private updateStepStatus(stepId: number, status: string, title: string|null): void {
    console.log(`Updating step ${stepId} to status ${status}`);
    
    const workflowData = this.editor.export();
    const nodes = workflowData.drawflow.Home.data;
    let nodeUpdated = false;

    for (const nodeId in nodes) {
      const node = nodes[nodeId];
      
      if (node.name === 'step' && node.data && node.data.id === stepId) {
        console.log(`Found step node ${nodeId} with id ${stepId}`);
        
        node.data.status = status.toLowerCase();
        node.data.title = title;
        
        this.editor.updateNodeDataFromId(parseInt(nodeId), node.data);
        
        this.updateNodeDisplay(nodeId, node.name, node.data);
        
        nodeUpdated = true;
        console.log(`Step ${stepId} updated successfully`);
        break;
      }
    }

    if (!nodeUpdated) {
      console.warn(`Step with id ${stepId} not found in workflow`);
    }
  }
  private updateTestCaseStatus(testCaseId: number, status: string, title: string |null): void {
    console.log(`Updating test case ${testCaseId} to status ${status}`);
    
    const workflowData = this.editor.export();
    const nodes = workflowData.drawflow.Home.data;
    let nodeUpdated = false;

    for (const nodeId in nodes) {
      const node = nodes[nodeId];
      
      if (node.name === 'testcase' && node.data && node.data.id === testCaseId) {
        console.log(`Found testcase node ${nodeId} with id ${testCaseId}`);
        
        node.data.status = status.toLowerCase();
        node.data.title = title;
        
        this.editor.updateNodeDataFromId(parseInt(nodeId), node.data);
        
        this.updateNodeDisplay(nodeId, node.name, node.data);
        
        nodeUpdated = true;
        console.log(`Test case ${testCaseId} updated successfully`);
        break;
      }
    }

    if (!nodeUpdated) {
      console.warn(`Test case with id ${testCaseId} not found in workflow`);
    }
  }
  private updateWorkflowStatus(workflowId: number, status: string, title: string): void {
    console.log(`Workflow ${workflowId} status: ${status}`);
    
    const startButtons = document.querySelectorAll('.start-button');
    startButtons.forEach(button => {
      const icon = button.querySelector('.start-icon') as HTMLElement;
      if (icon) {
        if (status === 'completed' || status === 'failed') {
          icon.innerText = 'play_arrow';
          icon.classList.remove('rotating');
          icon.style.color = '';
        } else if (status === 'running') {
          icon.innerText = 'autorenew';
          icon.classList.add('rotating');
          icon.style.color = 'white';
        }
      }
    });

    if (status === 'completed') {
      this.snackBar.open('Workflow exécuté avec succès', 'Fermer', { duration: 3000 });
    } else if (status === 'failed') {
      this.snackBar.open('Erreur lors de l\'exécution du workflow', 'Fermer', { duration: 3000 });
    }
  }
  private updateNodeDisplay(nodeId: string, nodeName: string, nodeData: any): void {
    const nodeElement = document.querySelector(`#node-${nodeId} .drawflow_content_node`);
    if (nodeElement) {
      nodeElement.innerHTML = this.getHtml(nodeName, nodeData);
      console.log(`Updated display for node ${nodeId}`);
    } else {
      console.warn(`Node element not found for node ${nodeId}`);
    }
  }
  executeWorkflow(): void {
    const workflowId = this.currentWorkflow?.id;

    if (!workflowId) {
      this.snackBar.open('Veuillez d\'abord sauvegarder le workflow', 'Fermer', { duration: 3000 });
      return;
    }

    this.resetAllNodeStatuses();

    const startButtons = document.querySelectorAll('.start-button');
    startButtons.forEach(button => {
      const icon = button.querySelector('.start-icon') as HTMLElement;
      if (icon) {
        icon.innerText = 'autorenew';
        icon.classList.add('rotating');
        icon.style.color = 'white';
      }
    });

    this.fonctionalReportService.executeWorkflow(workflowId).subscribe({
      next: (response) => {
        console.log('Workflow execution started:', response);
        this.snackBar.open(`Exécution du workflow ${workflowId} démarrée`, 'Fermer', { duration: 3000 });
      },
      error: (error) => {
        console.error('Erreur lors de l\'exécution du workflow:', error);
        this.snackBar.open('Erreur lors du démarrage de l\'exécution', 'Fermer', { duration: 3000 });
        
        startButtons.forEach(button => {
          const icon = button.querySelector('.start-icon') as HTMLElement;
          if (icon) {
            icon.innerText = 'play_arrow';
            icon.classList.remove('rotating');
            icon.style.color = '';
          }
        });
      }
    });
  }
  private resetAllNodeStatuses(): void {
    const workflowData = this.editor.export();
    const nodes = workflowData.drawflow.Home.data;

    for (const nodeId in nodes) {
      const node = nodes[nodeId];
      
      if ((node.name === 'step' || node.name === 'testcase') && node.data) {
        node.data.status = 'pending';
        this.editor.updateNodeDataFromId(parseInt(nodeId), node.data);
        this.updateNodeDisplay(nodeId, node.name, node.data);
      }
    }
  }
  loadWorkflowWithData(id: number) {
    forkJoin({
      workflow: this.fonctionalReportService.getWorkflow(id),
      testCases: this.fonctionalReportService.getTestCasesByWorkflow(id)
    }).subscribe({
      next: (data) => {
        this.currentWorkflow = data.workflow;
        this.testCases = data.testCases;
        
        if (this.testCases.length > 0) {
          const stepRequests = this.testCases.map(tc => 
            this.fonctionalReportService.getStepTestsByTestCase(tc.id!)
          );
          
          forkJoin(stepRequests).subscribe({
            next: (stepsArrays) => {
              this.allSteps = stepsArrays.flat();
              this.initializeDrawflowWithData();
            },
            error: (error) => {
              console.error('Erreur lors du chargement des steps', error);
              this.initializeDrawflowWithData();
            }
          });
        } else {
          this.initializeDrawflowWithData();
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement du workflow', error);
        this.snackBar.open('Erreur de chargement du workflow', 'Fermer', { duration: 3000 });
        this.initializeDrawflow();
      }
    });
  }
  initializeDrawflowWithData() {
    this.initializeDrawflow(); 
    if (this.currentWorkflow?.data_drawflow) {
      this.editor.import(this.currentWorkflow.data_drawflow);
      this.checkExistingNodes(this.currentWorkflow.data_drawflow);
    } else {
      this.createDrawflowFromDatabaseData();
    }
    this.updateAllNodesDisplay();
  }
  createDrawflowFromDatabaseData() {
    if (!this.testCases.length) return;
    if (!this.hasStartNode) {
      const startPosition = {
        x: -220,
        y: -150
      };
      this.addNodeAtPosition('start', startPosition.x, startPosition.y);
    }
    let previousNodeId: number | null = null;
    const startNodes = this.getNodesByType('start');
    if (startNodes.length > 0) {
      previousNodeId = parseInt(startNodes[0]);
    }
    this.testCases.forEach((testCase, index) => {
      const position = {
        x:-250,
        y: 10+ (index * 250),
      };
      const nodeData = {
        id: testCase.id,
        title: testCase.title,
        type: 'testcase',
        description: '',
        settings: {},
        status: testCase.statut || 'pending',
        ordre_execution: testCase.ordre_execution
      };
      const nodeId = this.editor.addNode(
        'testcase',
        1,
        1, 
        position.x,
        position.y,
        'testcase',
        nodeData,
        this.getHtml('testcase', nodeData),
        false
      );
      if (previousNodeId !== null) {
        this.editor.addConnection(previousNodeId, nodeId, 'output_1', 'input_1');
      }
      const testCaseSteps = this.allSteps.filter(step => step.test_case_id === testCase.id);
      let stepX = position.x + 300;

      testCaseSteps.forEach((step, stepIndex) => {
        const stepPosition = {
          x: stepX,
          y: position.y  + (stepIndex * 120),
        };

        const stepData = {
          id: step.id,
          title: step.title,
          type: 'step',
          description: step.description || '',
          settings: step.settings || {},
          status: step.statut || 'pending',
          ordre_execution: step.ordre_execution,
          parentTestCaseId: testCase.id
        };

        const stepNodeId = this.editor.addNode(
          'step',
          1,
          1, 
          stepPosition.x,
          stepPosition.y,
          'step',
          stepData,
          this.getHtml('step', stepData),
          false
        );
        this.editor.addConnection(nodeId, stepNodeId, 'output_1', 'input_1');
      });
    if (typeof nodeId !== 'number') {
      throw new Error(`Invalid nodeId: ${nodeId}`);
    }
      previousNodeId = nodeId;
    });
    if (!this.hasEndNode && previousNodeId !== null) {
      const endPosition = {
        x: -220,
        y: 200 + (this.testCases.length * 100),
      };
      const endNodeId = this.addNodeAtPosition('end', endPosition.x, endPosition.y);
      this.editor.addConnection(previousNodeId, endNodeId, 'output_1', 'input_1');
    }
  }
  getNodesByType(type: string): string[] {
    const currentData = this.editor.export();
    const nodes: string[] = [];
    
    Object.keys(currentData.drawflow.Home.data).forEach(nodeId => {
      const node = currentData.drawflow.Home.data[nodeId];
      if (node.name === type) {
        nodes.push(nodeId);
      }
    });
    
    return nodes;
  }
  addNodeAtPosition(type: string, x: number, y: number): number {
    const inputs = this.getInputsForType(type);
    const outputs = this.getOutputsForType(type);
    
    const nodeData: any = {
      title: this.getDefaultTitle(type),
      type: type,
      description: '',
      settings: {},
      status: 'pending'
    };

    const nodeId = this.editor.addNode(
      type,
      inputs,
      outputs,
      x,
      y,
      type,
      nodeData,
      this.getHtml(type, nodeData),
      false
    );
    if (type === 'start') {
      this.hasStartNode = true;
    } else if (type === 'end') {
      this.hasEndNode = true;
    }
    if (typeof nodeId !== 'number') {
      throw new Error(`Invalid nodeId: ${nodeId}`);
    }
    return nodeId;

  }

  updateAllNodesDisplay() {
    const currentData = this.editor.export();
    
    Object.keys(currentData.drawflow.Home.data).forEach(nodeId => {
      const node = currentData.drawflow.Home.data[nodeId];
      const nodeElement = document.querySelector(`#node-${nodeId} .drawflow_content_node`);
      
      if (nodeElement && node.data) {
        nodeElement.innerHTML = this.getHtml(node.name, node.data);
      }
    });
  }

  checkExistingNodes(workflowData: DrawflowExport) {
    this.hasStartNode = false;
    this.hasEndNode = false;
    
    Object.values(workflowData.drawflow.Home.data).forEach((node: any) => {
      if (node.name === 'start') {
        this.hasStartNode = true;
      }
      if (node.name === 'end') {
        this.hasEndNode = true;
      }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (!this.currentWorkflow) {
        this.initializeDrawflow();
      }
    }, 100);

    this.drawflowContainer.nativeElement.addEventListener('click', (event: any) => {
      const target = event.target as HTMLElement;

      if (target.classList.contains('add-step-button')) {
        const nodeEl = target.closest('.drawflow-node');
        if (nodeEl) {
          const parentId = parseInt(nodeEl.id.replace('node-', ''), 10);
          this.addNode('step', parentId);
        }
      }

      if (target.closest('.start-button')) {
        const button = target.closest('.start-button') as HTMLElement;
        const icon = button.querySelector('.start-icon') as HTMLElement;
        const nodeEl = button.closest('.drawflow-node');

        if (nodeEl && icon) {
          icon.innerText = 'autorenew';
          icon.classList.add('rotating');
          icon.style.color = 'white';
          this.executeWorkflow();
        }
      }
    });
  }

  initializeDrawflow() {
    if (this.editor) {
      this.editor.clear();
    }
    
    this.editor = new Drawflow(this.drawflowContainer.nativeElement);
    this.editor.start();
    
    (this.editor as any).on("nodeSelected", (id: string) => {
      this.onNodeSelected(id);
    });

    this.editor.on('nodeUnselected', () => {
      this.selectedNode = null;
    });
  }
  addNode(type: string, parentId?: number) {
    if (type === 'start' && this.hasStartNode) {
      this.snackBar.open('Un seul nœud Start est autorisé par workflow', 'Fermer', { duration: 3000 });
      return;
    }
    
    if (type === 'end' && this.hasEndNode) {
      this.snackBar.open('Un seul nœud End est autorisé par workflow', 'Fermer', { duration: 3000 });
      return;
    }

    const position = this.getRandomPosition();
    const inputs = this.getInputsForType(type);
    const outputs = this.getOutputsForType(type);
    
    const nodeData: any = {
      title: this.getDefaultTitle(type),
      type: type,
      description: '',
      settings: {
        actionType: '',
        target: '',
        expectedValue: '',
      },
      status: 'pending'
    };

    if (type === 'step' && parentId !== undefined) {
      nodeData.parentTestCaseId = parentId;
    }

    const nodeId = this.editor.addNode(
      type,
      inputs,
      outputs,
      position.x,
      position.y,
      type,
      nodeData,
      this.getHtml(type, nodeData),
      false
    );
    if (type === 'start') {
      this.hasStartNode = true;
    } else if (type === 'end') {
      this.hasEndNode = true;
    }

    if (parentId !== undefined) {
      this.editor.addConnection(parentId, nodeId, 'output_1', 'input_1');
    }

    if (type === 'step') {
      const currentData = this.editor.export();
      this.updateStepOrders(currentData);
    }

    return nodeId;
  }
  getInputsForType(type: string): number {
    switch (type) {
      case 'start': return 0;
      case 'end': return 1;
      default: return 1;
    }
  }
  getOutputsForType(type: string): number {
    switch (type) {
      case 'end': return 0;
      default: return 1;
    }
  }
  getDefaultTitle(type: string): string {
    switch (type) {
      case 'start': return 'Start';
      case 'end': return 'End';
      case 'testcase': return 'Test Case';
      case 'step': return 'Step Test';
      default: return 'Node';
    }
  }
  truncate(text: string, limit: number = 20): string {
    return text.length > limit ? text.slice(0, limit) + '...' : text;
  }
  getRandomPosition() {
    return {
      x: 10 + Math.random() * 100,
      y: 10 + Math.random() * 100
    };
  }
  onActionTypeChange(): void {
    const actionType = this.nodeForm.get('actionType')?.value;
    this.nodeForm.patchValue({
      selector: '',
      url: '',
      text: '',
      timeout: 10
    });
  }
  showSelectorField(): boolean {
    const actionType = this.nodeForm.get('actionType')?.value;
    return ['click', 'type', 'wait_visible', 'wait_present', 'move_cursor', 'assert'].includes(actionType);
  }
  showUrlField(): boolean {
    const actionType = this.nodeForm.get('actionType')?.value;
    return actionType === 'navigate';
  }
  showTextField(): boolean {
    const actionType = this.nodeForm.get('actionType')?.value;
    return ['type', 'assert'].includes(actionType);
  }
  showTimeoutField(): boolean {
    const actionType = this.nodeForm.get('actionType')?.value;
    return ['click', 'wait_visible', 'wait_present', 'move_cursor', 'assert', 'wait', 'accept_alert'].includes(actionType); 
  }
  onNodeSelected(id: string) {
    const nodeInfo = this.editor.getNodeFromId(id);
    this.selectedNode = nodeInfo;
    
    if (nodeInfo && nodeInfo.data) {
      this.nodeForm.patchValue({
        title: nodeInfo.data.title || '',
        description: nodeInfo.data.description || '',
        actionType: nodeInfo.data.settings?.actionType || '',
        selector: nodeInfo.data.settings?.selector || '',
        url: nodeInfo.data.settings?.url || '',
        text: nodeInfo.data.settings?.text || '',
        timeout: nodeInfo.data.settings?.timeout || 10
      });
    }
  }
  updateNode() {
    if (!this.selectedNode) return;

    const formData = this.nodeForm.value;
    const nodeData = {
      ...this.selectedNode.data,
      title: formData.title,
      description: formData.description,
      settings: {
        ...this.selectedNode.data.settings,
        actionType: formData.actionType,
        selector: formData.selector,
        url: formData.url,
        text: formData.text,
        timeout: formData.timeout
      }
    };

    this.editor.updateNodeDataFromId(this.selectedNode.id, nodeData);
    const nodeElement = document.querySelector(`#node-${this.selectedNode.id} .drawflow_content_node`);
    if (nodeElement) {
      nodeElement.innerHTML = this.getHtml(this.selectedNode.name, nodeData);
    }

    this.snackBar.open('Node updated successfully', 'Close', { duration: 3000 });
  }
  getHtml(type: string, data: any): string {
    const fullTitle = data.title || this.getDefaultTitle(type);
    const title = this.truncate(fullTitle, 20);
    const settings = data.settings || {};
    const status = data.status || 'pending';
    
    const statusColors = {
      passed: 'bg-success',
      failed: 'bg-danger',
      pending: 'bg-warning'
    } as const;

    const safeStatus = (['passed', 'failed', 'pending'].includes(status) ? status : 'pending') as keyof typeof statusColors;
    const statusColor = statusColors[safeStatus];
    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

    if (type === 'start') {
      return `
        <div class="node ${type}">
          <div class="start-button-container">
            <button class="start-button" data-node-type="start">
              <i class="material-icons start-icon">play_arrow</i>
            </button>
          </div>
        </div>
      `;
    }

    if (type === 'end') {
      return `
        <div class="node ${type}">
          <div class="end-button-container">
            <button class="end-button" data-node-type="end">
              <i class="material-icons end-icon">stop</i>
            </button>
          </div>
        </div>
      `;
    }

    if (type === 'step') {
      let actionInfo = '';
      if (settings.actionType) {
        const actionLabels = {
          'click': 'Click',
          'type': 'Type',
          'navigate': 'Navigate',
          'wait_visible': 'Wait Visible',
          'wait_present': 'Wait Present',
          'move_cursor': 'Move Cursor',
          'assert': 'Assert',
          'screenshot': 'Screenshot'
        };
        actionInfo = ` (${actionLabels[settings.actionType as keyof typeof actionLabels] || settings.actionType})`;
      }

      return `
        <div class="node ${type}">
          <div class="node-title" title="${fullTitle}">
            <div class="status-indicator badge ${statusColor} text-white position-absolute" 
                 style="top: -8px; right: -8px; font-size: 0.7rem; z-index: 10; border-radius: 12px;">
              ${statusLabel}
            </div>
            Step ${data.ordre_execution || '?'}: ${title}${actionInfo}
          </div>
        </div>
      `;
    }

    if (type === 'testcase') {
      return `
        <div class="node drawflow-node-body ${type}" style="position: relative; min-height: 70px; padding: 10px;">
          <div class="status-indicator badge ${statusColor} text-white position-absolute" 
               style="top: -8px; right: -8px; font-size: 0.7rem; z-index: 10; border-radius: 12px;">
            ${statusLabel}
          </div>

          <div class="node-title text-center fw-bold" title="${fullTitle}">
            ${title}
          </div>

          <div class="floating-actions" style="position: absolute; bottom: -15px; right: -15px; z-index: 15;">
            <button class="add-step-button" data-parent-id="${data.id || 'temp'}" title="Add Step" 
                    style="width: 32px; height: 32px; border-radius: 50%; padding: 0; margin-bottom: 8px;
                           border: 2px solid white; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-plus"></i>
            </button>
          </div>
        </div>
      `;
    }

    return `
      <div class="node ${type}">
        <div class="node-title" title="${fullTitle}">
          ${title}
        </div>
      </div>
    `;
  }

  deleteSelectedNode() {
    if (this.selectedNode) {
      if (this.selectedNode.name === 'start') {
        this.hasStartNode = false;
      } else if (this.selectedNode.name === 'end') {
        this.hasEndNode = false;
      }
      
      this.editor.removeNodeId(`node-${this.selectedNode.id}`);
      this.selectedNode = null;
      this.snackBar.open('Node deleted successfully', 'Close', { duration: 3000 });
    }
  }
  saveWorkflow(): void {
    try {
      const workflowData = this.editor.export();
      console.log('Workflow data to save:', workflowData);
      if (this.currentWorkflow) {
        const updatedWorkflow = {
          ...this.currentWorkflow,
          data_drawflow: workflowData
        };
        
        this.fonctionalReportService.updateWorkflow(this.workflowId, updatedWorkflow).subscribe({
          next: () => {
            const cleanWorkflowData = this.cleanDrawflowData(workflowData);
            this.saveTestCasesAndSteps(cleanWorkflowData);
            this.snackBar.open('Workflow sauvegardé avec succès', 'Fermer', { duration: 3000 });
          },
          error: (error) => {
            console.error('Erreur lors de la sauvegarde du workflow:', error);
            this.snackBar.open('Erreur lors de la sauvegarde du workflow', 'Fermer', { duration: 3000 });
          }
        });
      }
    } catch (error) {
      console.error('Erreur lors de la préparation des données:', error);
      this.snackBar.open('Erreur lors de la préparation des données', 'Fermer', { duration: 3000 });
    }
  }
private convertToTestCases(workflowData: any): TestCase[] {
  const testCases: TestCase[] = [];
  let testCaseOrder = 1;
  
  Object.keys(workflowData.drawflow.Home.data).forEach(nodeId => {
    const node = workflowData.drawflow.Home.data[nodeId];
    
    if (node.name === 'testcase') {
      // Use the actual node ID from the drawflow data, not a custom one
      const actualNodeId = parseInt(nodeId, 10);
      
      const testCase: TestCase = {
        id: node.data.id || actualNodeId, // Use data.id if available, fallback to nodeId
        workflow_id: this.workflowId,
        title: node.data.title,
        ordre_execution: testCaseOrder++,
        step_tests: this.getStepsForTestCase(actualNodeId, workflowData), // Pass the actual node ID
        statut: 'pending'
      };
      testCases.push(testCase);
    }
  });

  return testCases;
}
  updateStepOrders(workflowData: any) {
    const stepsGroupedByTestCase: { [testCaseId: number]: DrawflowNode[] } = {};

    Object.values(workflowData.drawflow.Home.data).forEach((node: any) => {
      if (node.name === 'step' && node.data.parentTestCaseId) {
        const parentId = node.data.parentTestCaseId;
        if (!stepsGroupedByTestCase[parentId]) {
          stepsGroupedByTestCase[parentId] = [];
        }
        stepsGroupedByTestCase[parentId].push(node);
      }
    });

    Object.entries(stepsGroupedByTestCase).forEach(([testCaseId, stepNodes]) => {
      stepNodes.forEach((node: any, index: number) => {
        node.data.ordre_execution = index + 1;
        this.editor.updateNodeDataFromId(node.id, node.data);

        const nodeElement = document.querySelector(`#node-${node.id} .drawflow_content_node`);
        if (nodeElement) {
          nodeElement.innerHTML = this.getHtml(node.name, node.data);
        }
      });
    });
  }

private getStepsForTestCase(testCaseNodeId: number, workflowData: any): StepTest[] {
  const steps: StepTest[] = [];
  let stepOrder = 1;

  console.log('Looking for steps for testcase node ID:', testCaseNodeId);

  Object.keys(workflowData.drawflow.Home.data).forEach(nodeId => {
    const node = workflowData.drawflow.Home.data[nodeId];

    console.log(`Checking node ${nodeId}:`, {
      name: node.name,
      parentTestCaseId: node.data?.parentTestCaseId,
      targetTestCaseId: testCaseNodeId
    });

    if (
      node.name === 'step' &&
      node.data?.parentTestCaseId === testCaseNodeId
    ) {
      console.log(`Found step for testcase ${testCaseNodeId}:`, node);
      
      const ordre = stepOrder++;
      node.data.ordre_execution = ordre;

      steps.push({
        title: node.data.title || `Step ${ordre}`, // Use step's own title, not testcase title
        test_case_id: testCaseNodeId,
        ordre_execution: ordre,
        description: node.data.description || '',
        settings: node.data.settings || {},
        statut: 'pending'
      });
    }
  });

  console.log(`Found ${steps.length} steps for testcase ${testCaseNodeId}`);
  return steps;
}
  clearWorkflow() {
    if (confirm('Are you sure you want to clear the workflow? This action cannot be undone.')) {
      try {
        this.editor.clear();
        this.selectedNode = null;
        this.hasStartNode = false;
        this.hasEndNode = false;
        this.testCases = [];
        this.allSteps = [];
        this.snackBar.open('Workflow cleared', 'Close', { duration: 2000 });
      } catch (error) {
        console.error('Error clearing workflow:', error);
        this.snackBar.open('Error clearing workflow', 'Close', { duration: 3000 });
      }
    }
  }
  private saveTestCasesAndSteps(workflowData: DrawflowExport): void {
    try {
      console.log('WorkflowData brut:', workflowData);
      const testCases = this.convertToTestCases(workflowData);
      console.log('TestCases convertis:', testCases);

      if (testCases.length === 0) {
        console.log('No test cases to save');
        return;
      }
      testCases.forEach(testCase => {
        const cleanTestCase: TestCase = {
          title: testCase.title || '',
          ordre_execution: testCase.ordre_execution,
          statut: 'pending',
          workflow_id: this.workflowId
        };

        this.fonctionalReportService.createTestCase(cleanTestCase).subscribe({
          next: (createdTestCase) => {
            if (testCase.step_tests && testCase.step_tests.length > 0) {
              testCase.step_tests.forEach(step => {
                const cleanStep: StepTest = {
                  title: step.title,
                  test_case_id: createdTestCase.id!, 
                  ordre_execution: step.ordre_execution,
                  description: step.description,
                  settings: step.settings || {},
                  statut: 'pending'
                };
                this.fonctionalReportService.createStepTest(cleanStep).subscribe();
              });
            }
          },
          error: (error) => {
            console.error('Error saving test case:', error);
          }
        });
      });
    } catch (error) {
      console.error('Error during test case conversion:', error);
      this.snackBar.open('Error saving test cases', 'Close', { duration: 3000 });
    }
  }
  private saveStepsForTestCase(testCase: TestCase, steps: StepTest[]): void {
    if (!steps || steps.length === 0) {
      return;
    }
    steps.forEach((step) => {
      const cleanStep: StepTest = {
        test_case_id: testCase.id!,
        ordre_execution: step.ordre_execution,
        title: step.title || '',
        description: step.description || '',
        settings: step.settings || {},
        statut: 'pending'
      };
      this.fonctionalReportService.createStepTest(cleanStep).subscribe({
        next: () => {
          console.log('StepTest sauvegardé pour TC', testCase.id);
        },
        error: (error) => {
          console.error('Erreur sauvegarde StepTest:', error);
        }
      });
    });
  }

  private cleanDrawflowData(data: any): DrawflowExport {
    try {
      const cleanData = JSON.parse(JSON.stringify(data, (key, value) => {
        if (key === 'parent' || key === 'parentNode' || key === 'ownerDocument') {
          return undefined;
        }
        return value;
      }));
      if (!cleanData.drawflow) {
        cleanData.drawflow = { Home: { data: {} } };
      }
      if (!cleanData.drawflow.Home) {
        cleanData.drawflow.Home = { data: {} };
      }
      if (!cleanData.drawflow.Home.data) {
        cleanData.drawflow.Home.data = {};
      }

      return cleanData as DrawflowExport;
    } catch (error) {
      console.error('Erreur lors du nettoyage des données:', error);
      return {
        drawflow: {
          Home: {
            data: {}
          }
        }
      };
    }
  }

  toggleEditMode(): void {
    this.isEditingWorkflowDetails = !this.isEditingWorkflowDetails;
    
    if (this.isEditingWorkflowDetails) {
      this.workflowDetailsForm.patchValue({
        title: this.currentWorkflow?.title || '',
        description: this.currentWorkflow?.description || ''
      });
    }
  }
  cancelEdit(): void {
    this.isEditingWorkflowDetails = false;
    this.workflowDetailsForm.reset();
  }
  updateWorkflowDetails(): void {
    if (!this.currentWorkflow || this.workflowDetailsForm.invalid) {
      return;
    }

    this.isUpdating = true;
    const formValues = this.workflowDetailsForm.value;
    
    const updatedWorkflow: Workflow = {
      ...this.currentWorkflow,
      title: formValues.title.trim(),
      description: formValues.description?.trim() || ''
    };

    this.fonctionalReportService.updateWorkflow(this.workflowId, updatedWorkflow).subscribe({
      next: (response) => {
        this.currentWorkflow = response;
        this.isEditingWorkflowDetails = false;
        this.isUpdating = false;
        
        this.snackBar.open('Workflow details updated successfully', 'Close', { 
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        console.error('Error updating workflow details:', error);
        this.isUpdating = false;
        
        let errorMessage = 'Failed to update workflow details';
        if (error?.error?.detail) {
          errorMessage = error.error.detail;
        } else if (error?.message) {
          errorMessage = error.message;
        }

        this.snackBar.open(errorMessage, 'Close', { 
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}