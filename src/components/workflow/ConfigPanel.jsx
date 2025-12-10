// src/components/workflow/ConfigPanel.jsx
// Node configuration panel

import { Cpu, Gauge, Save, Settings, Thermometer, X, Zap } from 'lucide-react';
import useWorkflowStore from '../../stores/useWorkflowStore';

function ConfigPanel() {
    const {
        selectedNodeId,
        selectedNodeCategory,
        selectedNodeIsAction,
        nodes,
        closeConfigPanel,
        saveNodeConfig,
        getSelectedNodeSensors,
        operatorOptions,
        severityOptions,
        // Config values
        configSensorType,
        configOperator,
        configThreshold,
        configThresholdMax,
        configSeverity,
        configPhoneNumber,
        configEmail,
        configWebhookUrl,
        configMessageTemplate,
        configSpecificEquipmentId,
        setConfigValue,
    } = useWorkflowStore();

    const selectedNode = nodes.find((n) => n.id === selectedNodeId);
    const sensors = getSelectedNodeSensors();

    const handleSave = () => {
        saveNodeConfig();
    };

    if (!selectedNodeId || !selectedNode) {
        return (
            <div className="h-full flex flex-col bg-slate-900/50 items-center justify-center p-6">
                <Settings className="w-12 h-12 text-slate-600 mb-3" />
                <p className="text-slate-500 text-sm text-center">
                    Select a node to configure
                </p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-900/50">
            {/* Header */}
            <div className="p-3 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Settings className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm text-white">Configure</h3>
                        <p className="text-xs text-slate-400">{selectedNode.data?.label}</p>
                    </div>
                </div>
                <button
                    onClick={closeConfigPanel}
                    className="p-1.5 rounded hover:bg-slate-700/50 transition-colors text-slate-400"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {selectedNodeIsAction ? (
                    <ActionConfigForm
                        category={selectedNodeCategory}
                        configSeverity={configSeverity}
                        configPhoneNumber={configPhoneNumber}
                        configEmail={configEmail}
                        configWebhookUrl={configWebhookUrl}
                        configMessageTemplate={configMessageTemplate}
                        setConfigValue={setConfigValue}
                        severityOptions={severityOptions}
                    />
                ) : (
                    <EquipmentConfigForm
                        sensors={sensors}
                        configSensorType={configSensorType}
                        configOperator={configOperator}
                        configThreshold={configThreshold}
                        configThresholdMax={configThresholdMax}
                        configSeverity={configSeverity}
                        configSpecificEquipmentId={configSpecificEquipmentId}
                        setConfigValue={setConfigValue}
                        operatorOptions={operatorOptions}
                        severityOptions={severityOptions}
                    />
                )}
            </div>

            {/* Save Button */}
            <div className="p-3 border-t border-slate-700/50">
                <button
                    onClick={handleSave}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors font-medium"
                >
                    <Save className="w-4 h-4" />
                    Save Configuration
                </button>
            </div>
        </div>
    );
}

function EquipmentConfigForm({
    sensors,
    configSensorType,
    configOperator,
    configThreshold,
    configThresholdMax,
    configSeverity,
    configSpecificEquipmentId,
    setConfigValue,
    operatorOptions,
    severityOptions,
}) {
    return (
        <>
            {/* Sensor Type */}
            <FieldGroup label="Sensor Type" icon={Thermometer}>
                <select
                    value={configSensorType}
                    onChange={(e) => setConfigValue('configSensorType', e.target.value)}
                    className="input-field w-full"
                >
                    <option value="">Select sensor...</option>
                    {sensors.map((sensor) => (
                        <option key={sensor.id} value={sensor.id}>
                            {sensor.name} ({sensor.unit})
                        </option>
                    ))}
                </select>
            </FieldGroup>

            {/* Operator */}
            <FieldGroup label="Condition" icon={Gauge}>
                <select
                    value={configOperator}
                    onChange={(e) => setConfigValue('configOperator', e.target.value)}
                    className="input-field w-full"
                >
                    {operatorOptions.map((op) => (
                        <option key={op.value} value={op.value}>
                            {op.label}
                        </option>
                    ))}
                </select>
            </FieldGroup>

            {/* Threshold */}
            <FieldGroup label="Threshold" icon={Zap}>
                <div className="flex gap-2">
                    <input
                        type="number"
                        value={configThreshold}
                        onChange={(e) => setConfigValue('configThreshold', e.target.value)}
                        placeholder="Min/Value"
                        className="input-field flex-1"
                    />
                    {configOperator === 'between' && (
                        <input
                            type="number"
                            value={configThresholdMax}
                            onChange={(e) => setConfigValue('configThresholdMax', e.target.value)}
                            placeholder="Max"
                            className="input-field flex-1"
                        />
                    )}
                </div>
            </FieldGroup>

            {/* Severity */}
            <FieldGroup label="Alert Severity" icon={Cpu}>
                <div className="flex gap-2">
                    {severityOptions.map((sev) => (
                        <button
                            key={sev.value}
                            onClick={() => setConfigValue('configSeverity', sev.value)}
                            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${configSeverity === sev.value
                                    ? sev.value === 'critical'
                                        ? 'bg-red-500/30 border-red-500 text-red-400'
                                        : sev.value === 'warning'
                                            ? 'bg-orange-500/30 border-orange-500 text-orange-400'
                                            : 'bg-blue-500/30 border-blue-500 text-blue-400'
                                    : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'
                                }`}
                        >
                            {sev.label}
                        </button>
                    ))}
                </div>
            </FieldGroup>

            {/* Specific Equipment ID for 3D flash */}
            <FieldGroup label="3D Model ID (for alerts)" icon={Cpu}>
                <input
                    type="text"
                    value={configSpecificEquipmentId}
                    onChange={(e) => setConfigValue('configSpecificEquipmentId', e.target.value)}
                    placeholder="e.g., Centrifuge_01"
                    className="input-field w-full"
                />
                <p className="text-xs text-slate-500 mt-1">
                    Enter the mesh name from the 3D model to flash on alert
                </p>
            </FieldGroup>
        </>
    );
}

function ActionConfigForm({
    category,
    configSeverity,
    configPhoneNumber,
    configEmail,
    configWebhookUrl,
    configMessageTemplate,
    setConfigValue,
    severityOptions,
}) {
    return (
        <>
            {/* Severity */}
            <FieldGroup label="Alert Severity" icon={Cpu}>
                <div className="flex gap-2">
                    {severityOptions.map((sev) => (
                        <button
                            key={sev.value}
                            onClick={() => setConfigValue('configSeverity', sev.value)}
                            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${configSeverity === sev.value
                                    ? sev.value === 'critical'
                                        ? 'bg-red-500/30 border-red-500 text-red-400'
                                        : sev.value === 'warning'
                                            ? 'bg-orange-500/30 border-orange-500 text-orange-400'
                                            : 'bg-blue-500/30 border-blue-500 text-blue-400'
                                    : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'
                                }`}
                        >
                            {sev.label}
                        </button>
                    ))}
                </div>
            </FieldGroup>

            {/* Channel-specific fields */}
            {category === 'whatsapp' && (
                <FieldGroup label="Phone Number" icon={Zap}>
                    <input
                        type="tel"
                        value={configPhoneNumber}
                        onChange={(e) => setConfigValue('configPhoneNumber', e.target.value)}
                        placeholder="+1234567890"
                        className="input-field w-full"
                    />
                </FieldGroup>
            )}

            {category === 'email' && (
                <FieldGroup label="Email Address" icon={Zap}>
                    <input
                        type="email"
                        value={configEmail}
                        onChange={(e) => setConfigValue('configEmail', e.target.value)}
                        placeholder="alert@company.com"
                        className="input-field w-full"
                    />
                </FieldGroup>
            )}

            {category === 'webhook' && (
                <FieldGroup label="Webhook URL" icon={Zap}>
                    <input
                        type="url"
                        value={configWebhookUrl}
                        onChange={(e) => setConfigValue('configWebhookUrl', e.target.value)}
                        placeholder="https://api.example.com/webhook"
                        className="input-field w-full"
                    />
                </FieldGroup>
            )}

            {/* Message Template */}
            <FieldGroup label="Message Template (optional)" icon={Zap}>
                <textarea
                    value={configMessageTemplate}
                    onChange={(e) => setConfigValue('configMessageTemplate', e.target.value)}
                    placeholder="Custom message template..."
                    rows={3}
                    className="input-field w-full resize-none"
                />
            </FieldGroup>
        </>
    );
}

function FieldGroup({ label, icon: Icon, children }) {
    return (
        <div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-2">
                <Icon className="w-3 h-3" />
                {label}
            </label>
            {children}
        </div>
    );
}

export default ConfigPanel;
