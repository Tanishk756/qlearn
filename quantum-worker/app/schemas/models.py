"""
Q-Learn Nexus - Quantum Worker Data Models
Compatible with both Pydantic (FastAPI runtime) and standard library dataclasses (zero-dependency runner).
"""

from typing import List, Dict, Optional, Any, Union
try:
    from pydantic import BaseModel, Field
    HAS_PYDANTIC = True
except ImportError:
    HAS_PYDANTIC = False
    from dataclasses import dataclass, field

if HAS_PYDANTIC:
    class GateParams(BaseModel):
        theta: Optional[float] = None
        phi: Optional[float] = None
        lambda_: Optional[float] = Field(None, alias="lambda")

    class CircuitGate(BaseModel):
        id: str
        type: str
        targets: List[int]
        controls: Optional[List[int]] = None
        stepIndex: int = 0
        params: Optional[GateParams] = None

    class QuantumCircuitIR(BaseModel):
        version: str = "1.0"
        name: str = "Circuit"
        qubits: int = Field(..., ge=1, le=16)
        classicalBits: int = Field(..., ge=1, le=16)
        gates: List[CircuitGate] = Field(default_factory=list)

    class BlochVector(BaseModel):
        qubit: int
        x: float
        y: float
        z: float
        theta: float
        phi: float
        p0: float
        p1: float

    class NormalizedResult(BaseModel):
        success: bool
        provider: str
        backend: str
        qubits: int
        shots: int
        counts: Dict[str, int]
        probabilities: Dict[str, float]
        statevector: Optional[List[Dict[str, float]]] = None
        densityMatrix: Optional[List[List[Dict[str, float]]]] = None
        blochVectors: Optional[List[BlochVector]] = None
        executionTimeMs: float
        metadata: Dict[str, Any] = Field(default_factory=dict)
        error: Optional[str] = None

    class SimulationRequest(BaseModel):
        circuitIR: Optional[QuantumCircuitIR] = None
        qasm: Optional[str] = None
        provider: str = "custom"
        backend: Optional[str] = "statevector"
        shots: int = Field(1024, ge=1, le=100000)
        noiseModel: Optional[Dict[str, Any]] = None

    class CodeExecutionRequest(BaseModel):
        framework: str
        code: str
        timeoutMs: int = Field(5000, ge=100, le=10000)

else:
    @dataclass
    class GateParams:
        theta: Optional[float] = None
        phi: Optional[float] = None
        lambda_: Optional[float] = None

    @dataclass
    class CircuitGate:
        id: str
        type: str
        targets: List[int]
        controls: Optional[List[int]] = None
        stepIndex: int = 0
        params: Optional[GateParams] = None

    @dataclass
    class QuantumCircuitIR:
        qubits: int
        classicalBits: int
        gates: List[CircuitGate] = field(default_factory=list)
        version: str = "1.0"
        name: str = "Circuit"

    @dataclass
    class BlochVector:
        qubit: int
        x: float
        y: float
        z: float
        theta: float
        phi: float
        p0: float
        p1: float

    @dataclass
    class NormalizedResult:
        success: bool
        provider: str
        backend: str
        qubits: int
        shots: int
        counts: Dict[str, int]
        probabilities: Dict[str, float]
        statevector: Optional[List[Dict[str, float]]] = None
        densityMatrix: Optional[List[List[Dict[str, float]]]] = None
        blochVectors: Optional[List[BlochVector]] = None
        executionTimeMs: float = 0.0
        metadata: Dict[str, Any] = field(default_factory=dict)
        error: Optional[str] = None

    @dataclass
    class SimulationRequest:
        circuitIR: Optional[QuantumCircuitIR] = None
        qasm: Optional[str] = None
        provider: str = "custom"
        backend: Optional[str] = "statevector"
        shots: int = 1024
        noiseModel: Optional[Dict[str, Any]] = None

    @dataclass
    class CodeExecutionRequest:
        framework: str
        code: str
        timeoutMs: int = 5000
