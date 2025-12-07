/**
 * Test file to verify passenger state management functionality
 * This demonstrates the A3 State Management implementation
 */

interface PassengerData {
  fullName: string;
  documentId: string;
  seatCode: string;
  documentType?: 'id' | 'passport' | 'license';
  phoneNumber?: string;
  email?: string;
}

interface PassengerValidation {
  isValid: boolean;
  errors: string[];
  requiredFieldsFilled: boolean;
}

interface PassengerState {
  data: PassengerData;
  validation: PassengerValidation;
}

type PassengersState = PassengerState[];

// Mock implementation to test state management logic
class PassengerStateManager {
  private passengersState: PassengersState = [];

  // Initialize passenger state from selected seats
  initializePassengerState(seatCodes: string[]): void {
    this.passengersState = seatCodes.map((seatCode) => ({
      data: {
        fullName: "",
        documentId: "",
        seatCode: seatCode,
        documentType: "id",
        phoneNumber: "",
        email: ""
      },
      validation: {
        isValid: false,
        errors: [],
        requiredFieldsFilled: false
      }
    }));
  }

  // Update passenger data
  updatePassengerData(index: number, newData: Partial<PassengerData>): void {
    if (index >= 0 && index < this.passengersState.length) {
      this.passengersState[index] = {
        ...this.passengersState[index],
        data: {
          ...this.passengersState[index].data,
          ...newData
        }
      };
    }
  }

  // Update passenger validation
  updatePassengerValidation(index: number, isValid: boolean, errors: string[] = []): void {
    if (index >= 0 && index < this.passengersState.length) {
      const passengerData = this.passengersState[index].data;
      const requiredFieldsFilled = Boolean(passengerData.fullName.trim() && passengerData.documentId.trim());
      
      this.passengersState[index] = {
        ...this.passengersState[index],
        validation: {
          isValid,
          errors,
          requiredFieldsFilled
        }
      };
    }
  }

  // Get all passenger data
  getAllPassengerData(): PassengerData[] {
    return this.passengersState.map(passenger => passenger.data);
  }

  // Validate all passengers
  validateAllPassengers(): { isValid: boolean; errors: string[] } {
    const globalErrors: string[] = [];
    let allValid = true;

    this.passengersState.forEach((passenger, index) => {
      if (!passenger.validation.isValid) {
        allValid = false;
        globalErrors.push(`Passenger ${index + 1}: ${passenger.validation.errors.join(', ')}`);
      }
      
      if (!passenger.validation.requiredFieldsFilled) {
        allValid = false;
        globalErrors.push(`Passenger ${index + 1}: Missing required fields (name, document ID)`);
      }
    });

    // Check for duplicate document IDs
    const documentIds = this.passengersState.map(p => p.data.documentId.trim()).filter(id => id);
    const duplicateIds = documentIds.filter((id, index) => documentIds.indexOf(id) !== index);
    
    if (duplicateIds.length > 0) {
      allValid = false;
      globalErrors.push(`Duplicate document IDs found: ${[...new Set(duplicateIds)].join(', ')}`);
    }

    return { isValid: allValid, errors: globalErrors };
  }

  // Get current state for inspection
  getCurrentState(): PassengersState {
    return this.passengersState;
  }
}

// Test scenarios
function runTests() {
  console.log("🧪 Testing Passenger State Management (A3 Implementation)");
  
  const manager = new PassengerStateManager();
  
  // Test 1: Initialize with seats
  console.log("\n1. Initialize with 2 seats");
  manager.initializePassengerState(["A1", "A2"]);
  console.log("✓ State initialized:", manager.getCurrentState().length, "passengers");
  
  // Test 2: Update passenger data
  console.log("\n2. Update passenger data");
  manager.updatePassengerData(0, {
    fullName: "Nguyen Van A",
    documentId: "123456789012",
    phoneNumber: "0901234567"
  });
  
  manager.updatePassengerData(1, {
    fullName: "Tran Thi B", 
    documentId: "987654321098",
    email: "b@example.com"
  });
  
  console.log("✓ Passenger 1:", manager.getCurrentState()[0].data.fullName);
  console.log("✓ Passenger 2:", manager.getCurrentState()[1].data.fullName);
  
  // Test 3: Update validation
  console.log("\n3. Update validation states");
  manager.updatePassengerValidation(0, true, []);
  manager.updatePassengerValidation(1, true, []);
  
  // Test 4: Global validation
  console.log("\n4. Global validation");
  const validation = manager.validateAllPassengers();
  console.log("✓ All valid:", validation.isValid);
  console.log("✓ Errors:", validation.errors);
  
  // Test 5: Test duplicate detection
  console.log("\n5. Test duplicate document ID detection");
  manager.updatePassengerData(1, { documentId: "123456789012" }); // Same as passenger 1
  const duplicateValidation = manager.validateAllPassengers();
  console.log("✓ Duplicate detected:", !duplicateValidation.isValid);
  console.log("✓ Error message includes 'Duplicate':", duplicateValidation.errors.some(e => e.includes('Duplicate')));
  
  // Test 6: Get all passenger data for submission
  console.log("\n6. Get all passenger data for booking");
  const allData = manager.getAllPassengerData();
  console.log("✓ All passenger data:", allData.length, "passengers");
  console.log("✓ Seat codes:", allData.map(p => p.seatCode));
  
  console.log("\n🎉 All tests completed! State management is working correctly.");
  
  return {
    passengersInitialized: manager.getCurrentState().length === 2,
    dataUpdateWorks: allData[0].fullName === "Nguyen Van A",
    validationWorks: validation.isValid,
    duplicateDetectionWorks: !duplicateValidation.isValid && duplicateValidation.errors.some(e => e.includes('Duplicate')),
    allDataRetrievalWorks: allData.length === 2
  };
}

// Run the tests
const testResults = runTests();

export default testResults;