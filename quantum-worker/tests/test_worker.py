"""
Unit test suite for Quantum Worker.
Executable using standard library unittest runner.
"""

import unittest
import sys
import os

# Add quantum-worker to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.schemas.models import QuantumCircuitIR, CircuitGate
from app.providers.custom_sim import run_custom_simulation
from app.validators.security import validate_python_code
from app.executor import get_all_provider_statuses

class TestQuantumWorker(unittest.TestCase):

    def test_single_qubit_hadamard(self):
        circuit = QuantumCircuitIR(
            qubits=1,
            classicalBits=1,
            gates=[CircuitGate(id="g1", type="H", targets=[0])]
        )
        res = run_custom_simulation(circuit, shots=1000)
        self.assertTrue(res.success)
        self.assertAlmostEqual(res.probabilities.get("0", 0), 0.5, delta=0.01)
        self.assertAlmostEqual(res.probabilities.get("1", 0), 0.5, delta=0.01)
        self.assertAlmostEqual(res.blochVectors[0].x, 1.0, delta=0.01)

    def test_bell_state_little_endian(self):
        # H(q0) then CX(q0, q1)
        circuit = QuantumCircuitIR(
            qubits=2,
            classicalBits=2,
            gates=[
                CircuitGate(id="g1", type="H", targets=[0], stepIndex=0),
                CircuitGate(id="g2", type="CX", controls=[0], targets=[1], stepIndex=1)
            ]
        )
        res = run_custom_simulation(circuit, shots=2000)
        self.assertTrue(res.success)
        self.assertAlmostEqual(res.probabilities.get("00", 0), 0.5, delta=0.01)
        self.assertAlmostEqual(res.probabilities.get("11", 0), 0.5, delta=0.01)
        self.assertEqual(res.probabilities.get("01", 0), 0.0)
        self.assertEqual(res.probabilities.get("10", 0), 0.0)

    def test_qubit_ordering_basis_states(self):
        # X(q0) -> bit 0 is 1 -> bitstring "01" in 2-qubit register
        circuit_x0 = QuantumCircuitIR(
            qubits=2,
            classicalBits=2,
            gates=[CircuitGate(id="g1", type="X", targets=[0])]
        )
        res0 = run_custom_simulation(circuit_x0, shots=100)
        self.assertEqual(res0.probabilities.get("01", 0), 1.0)

        # X(q1) -> bit 1 is 1 -> bitstring "10" in 2-qubit register
        circuit_x1 = QuantumCircuitIR(
            qubits=2,
            classicalBits=2,
            gates=[CircuitGate(id="g1", type="X", targets=[1])]
        )
        res1 = run_custom_simulation(circuit_x1, shots=100)
        self.assertEqual(res1.probabilities.get("10", 0), 1.0)

    def test_ast_security_validator_prohibited_patterns(self):
        safe, reason = validate_python_code("import os\nvar = os.environ")
        self.assertFalse(safe)
        self.assertTrue("Prohibited import" in reason or "Static pattern" in reason)

        safe, reason = validate_python_code("import subprocess\nsubprocess.run(['cat', '/etc/passwd'])")
        self.assertFalse(safe)

        safe, reason = validate_python_code("f = open('/etc/shadow', 'r')")
        self.assertFalse(safe)

        safe, reason = validate_python_code("a = [1, 2, 3]\nb = sum(a)")
        self.assertTrue(safe)

    def test_provider_status_diagnostics(self):
        statuses = get_all_provider_statuses()
        self.assertEqual(statuses["custom_sim"]["status"], "READY")
        self.assertEqual(statuses["ibm_quantum"]["status"], "NOT CONFIGURED")
        self.assertEqual(statuses["aws_braket"]["status"], "NOT CONFIGURED")


if __name__ == '__main__':
    unittest.main()
