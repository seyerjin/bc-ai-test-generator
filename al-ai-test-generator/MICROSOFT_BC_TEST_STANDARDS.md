# Microsoft Business Central Test Standards

Diese Extension folgt den offiziellen Microsoft Business Central Test-Standards:
https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-test-codeunits-and-test-methods

## Generierte Test-Struktur

### 1. Test Codeunit
```al
codeunit 50100 "Customer Management Test"
{
    Subtype = Test;
    TestPermissions = Disabled;
    TestIsolation = Subscriber;

    var
        LibraryAssert: Codeunit "Library - Assert";
        LibraryRandom: Codeunit "Library - Random";
        IsInitialized: Boolean;
}
```

### 2. Test-Methoden

**Namenskonvention:** `Test[Feature]_[Scenario]_[ExpectedResult]`

```al
[Test]
procedure TestCreateCustomer_ValidData_CustomerCreated()
var
    Customer: Record Customer;
begin
    // [SCENARIO] Create a new customer with valid data
    
    // [GIVEN] A customer record with valid fields
    Initialize();
    Customer.Init();
    Customer."No." := 'C001';
    Customer.Name := 'Test Customer';
    
    // [WHEN] The customer is inserted
    Customer.Insert(true);
    
    // [THEN] The customer exists in the database
    LibraryAssert.IsTrue(Customer.Get('C001'), 'Customer should exist');
    LibraryAssert.AreEqual('Test Customer', Customer.Name, 'Name mismatch');
end;
```

### 3. Library - Assert

**Alle Assertions verwenden Library - Assert:**

```al
// Gleichheit prüfen
LibraryAssert.AreEqual(Expected, Actual, 'Error message');
LibraryAssert.AreNotEqual(NotExpected, Actual, 'Error message');

// Boolean prüfen
LibraryAssert.IsTrue(Condition, 'Error message');
LibraryAssert.IsFalse(Condition, 'Error message');

// Fehlerbehandlung
asserterror SomeMethod();
LibraryAssert.ExpectedError('Expected error text');

// Tabellen prüfen
LibraryAssert.RecordIsEmpty(RecordVar);
LibraryAssert.RecordIsNotEmpty(RecordVar);
```

### 4. TestPage für UI-Tests

```al
var
    CustomerCard: TestPage "Customer Card";
begin
    // Seite öffnen
    CustomerCard.OpenEdit();
    CustomerCard.GotoRecord(Customer);
    
    // Felder setzen
    CustomerCard."No.".SetValue('C001');
    CustomerCard.Name.SetValue('Test Customer');
    
    // Validieren
    LibraryAssert.AreEqual('C001', CustomerCard."No.".Value, 'No. mismatch');
    
    // Aktion ausführen
    CustomerCard.OK().Invoke();
end;
```

### 5. Handler Functions

**Message Handler:**
```al
[Test]
[HandlerFunctions('MessageHandler')]
procedure TestWithMessage()
begin
    // Test that shows a message
end;

[MessageHandler]
procedure MessageHandler(Message: Text[1024])
begin
    LibraryAssert.IsTrue(StrPos(Message, 'Success') > 0, 'Wrong message');
end;
```

**Confirm Handler:**
```al
[ConfirmHandler]
procedure ConfirmHandler(Question: Text[1024]; var Reply: Boolean)
begin
    Reply := true;
end;
```

**ModalPage Handler:**
```al
[ModalPageHandler]
procedure ItemListModalPageHandler(var ItemList: TestPage "Item List")
begin
    ItemList.First();
    ItemList.OK().Invoke();
end;
```

**StrMenu Handler:**
```al
[StrMenuHandler]
procedure StrMenuHandler(Options: Text[1024]; var Choice: Integer; Instructions: Text[1024])
begin
    Choice := 1; // Select first option
end;
```

### 6. Initialize Pattern

```al
local procedure Initialize()
begin
    if IsInitialized then
        exit;
    
    // One-time setup for all tests
    IsInitialized := true;
    Commit();
end;
```

### 7. Test Isolation

```al
codeunit 50100 "Test"
{
    TestIsolation = Subscriber; // Empfohlen
    // Optionen:
    // - Disabled: Keine Isolation
    // - Codeunit: Jede Codeunit isoliert
    // - Subscriber: Jeder Test isoliert (empfohlen)
}
```

### 8. Transaction Model

```al
[Test]
[TransactionModel(TransactionModel::AutoRollback)]
procedure TestWithAutoRollback()
begin
    // Changes werden automatisch zurückgerollt
end;
```

## Best Practices

### ✅ DO:
- Verwende [SCENARIO], [GIVEN], [WHEN], [THEN] Kommentare
- Verwende Library - Assert für alle Assertions
- Benenne Tests aussagekräftig: Test[Feature]_[Scenario]_[ExpectedResult]
- Teste Happy Path UND Error Cases
- Verwende Initialize() für Setup
- Nutze TestPage für UI-Tests
- Implementiere Handler Functions für Dialoge

### ❌ DON'T:
- Keine eigenen Assertion-Methoden erstellen
- Keine Test-Dependencies zwischen Tests
- Keine Hardcoded IDs verwenden (nutze LibraryRandom)
- Keine Test-Daten in Produktion hinterlassen
- Keine TODOs oder incomplete Tests committen

## Beispiel: Kompletter Test

```al
codeunit 50100 "Customer Validation Test"
{
    Subtype = Test;
    TestPermissions = Disabled;
    TestIsolation = Subscriber;

    var
        LibraryAssert: Codeunit "Library - Assert";
        LibraryRandom: Codeunit "Library - Random";
        Customer: Record Customer;
        IsInitialized: Boolean;

    [Test]
    procedure TestValidateEmail_ValidFormat_EmailAccepted()
    var
        ValidEmail: Text[80];
    begin
        // [SCENARIO] Valid email format should be accepted
        
        // [GIVEN] A customer with a valid email address
        Initialize();
        CreateTestCustomer(Customer);
        ValidEmail := LibraryRandom.RandText(5) + '@test.com';
        
        // [WHEN] The email is validated
        Customer.Validate("E-Mail", ValidEmail);
        Customer.Modify(true);
        
        // [THEN] The email is accepted without errors
        LibraryAssert.AreEqual(ValidEmail, Customer."E-Mail", 'Email should be accepted');
    end;

    [Test]
    procedure TestValidateEmail_InvalidFormat_Error()
    begin
        // [SCENARIO] Invalid email format should raise an error
        
        // [GIVEN] A customer with an invalid email
        Initialize();
        CreateTestCustomer(Customer);
        
        // [WHEN] [THEN] Setting invalid email should raise an error
        asserterror Customer.Validate("E-Mail", 'not-an-email');
        LibraryAssert.ExpectedError('not a valid email');
    end;

    [Test]
    [HandlerFunctions('ConfirmHandler')]
    procedure TestDeleteCustomer_WithConfirm_CustomerDeleted()
    var
        CustomerNo: Code[20];
    begin
        // [SCENARIO] Delete customer with confirmation
        
        // [GIVEN] An existing customer
        Initialize();
        CreateTestCustomer(Customer);
        CustomerNo := Customer."No.";
        
        // [WHEN] The customer is deleted with confirmation
        Customer.Delete(true);
        
        // [THEN] The customer no longer exists
        LibraryAssert.IsFalse(Customer.Get(CustomerNo), 'Customer should be deleted');
    end;

    [Test]
    procedure TestCustomerCard_OpenAndEdit_FieldsUpdated()
    var
        CustomerCard: TestPage "Customer Card";
    begin
        // [SCENARIO] Open customer card and edit fields
        
        // [GIVEN] An existing customer
        Initialize();
        CreateTestCustomer(Customer);
        
        // [WHEN] The customer card is opened and fields are edited
        CustomerCard.OpenEdit();
        CustomerCard.GotoRecord(Customer);
        CustomerCard.Name.SetValue('Updated Name');
        CustomerCard.OK().Invoke();
        
        // [THEN] The changes are saved
        Customer.Get(Customer."No.");
        LibraryAssert.AreEqual('Updated Name', Customer.Name, 'Name not updated');
    end;

    local procedure Initialize()
    begin
        if IsInitialized then
            exit;
        
        IsInitialized := true;
        Commit();
    end;

    local procedure CreateTestCustomer(var Customer: Record Customer)
    begin
        Customer.Init();
        Customer."No." := 'C' + LibraryRandom.RandText(10);
        Customer.Name := 'Test Customer ' + LibraryRandom.RandText(5);
        Customer."E-Mail" := LibraryRandom.RandText(5) + '@test.com';
        Customer.Insert(true);
    end;

    [ConfirmHandler]
    procedure ConfirmHandler(Question: Text[1024]; var Reply: Boolean)
    begin
        Reply := true;
    end;
}
```

## Weitere Ressourcen

- [Test Codeunits and Test Methods](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-test-codeunits-and-test-methods)
- [Testing the Application](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-testing-application)
- [Test Pages](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-testing-pages)
- [Handler Functions](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-creating-handler-functions)
