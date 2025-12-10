// src/__tests__/integration/workflow.test.js
import { beforeEach, describe, expect, it } from 'vitest';
import useMonitorStore from '../../stores/useMonitorStore';
import useWorkflowStore from '../../stores/useWorkflowStore';

describe('Workflow Integration', () => {
    beforeEach(() => {
        // Reset stores before each test
        useWorkflowStore.setState({
            nodes: [],
            edges: [],
            currentWorkflowId: '',
            currentWorkflowName: '',
        });

        useMonitorStore.setState({
            selectedObjectName: '',
            selectedObjectType: 'unknown',
        });
    });

    it('should create empty workflow with equipment node', () => {
        const { createEmptyWorkflow } = useWorkflowStore.getState();

        const equipmentInfo = {
            name: 'Analyzer_10',
            type: 'analyzer'
        };

        const workflowId = createEmptyWorkflow('Test Workflow', equipmentInfo);

        expect(workflowId).toBeTruthy();
        expect(workflowId.length).toBeGreaterThan(0);

        const { nodes, currentWorkflowName } = useWorkflowStore.getState();

        expect(currentWorkflowName).toBe('Test Workflow');
        expect(nodes).toHaveLength(1);
        expect(nodes[0].data.label).toBe('Analyzer_10');
        expect(nodes[0].data.category).toBe('analyzer');
    });

    it('should handle 3D selection and workflow creation flow', () => {
        const { handle3DSelection } = useMonitorStore.getState();
        const { createEmptyWorkflow } = useWorkflowStore.getState();

        // Simulate 3D click
        handle3DSelection('Centrifuge_01', 'centrifuge');

        const { selectedObjectName, selectedObjectType } = useMonitorStore.getState();
        expect(selectedObjectName).toBe('Centrifuge_01');
        expect(selectedObjectType).toBe('centrifuge');

        // Create workflow from selected equipment
        const equipmentInfo = { name: selectedObjectName, type: selectedObjectType };
        const workflowId = createEmptyWorkflow(`Maintenance: ${selectedObjectName}`, equipmentInfo);

        const { nodes } = useWorkflowStore.getState();
        expect(nodes[0].data.label).toBe('Centrifuge_01');
        expect(nodes[0].data.category).toBe('centrifuge');
    });

    it('should create workflow without equipment if not provided', () => {
        const { createEmptyWorkflow } = useWorkflowStore.getState();

        const workflowId = createEmptyWorkflow('Empty Workflow');

        const { nodes, currentWorkflowName } = useWorkflowStore.getState();

        expect(currentWorkflowName).toBe('Empty Workflow');
        expect(nodes).toHaveLength(0); // No nodes when no equipment provided
    });
});
