/// <summary>
/// Example test codeunit demonstrating BC testing best practices
/// </summary>
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

        // Multilingual Labels (DEU/ENU)
        EmailValidMsg: Label 'Email validation passed',
            Comment = 'DEU="E-Mail-Validierung erfolgreich",ENU="Email validation passed"';
        EmailInvalidErr: Label 'Invalid email format',
            Comment = 'DEU="Ungültiges E-Mail-Format",ENU="Invalid email format"';

    /// <summary>
    /// Test: Valid email format should be accepted
    /// </summary>
    [Test]
    procedure TestValidateEmail_ValidFormat_EmailAccepted()
    var
        ValidEmail: Text[80];
    begin
        // [SCENARIO] Customer record accepts valid email format
        
        // [GIVEN] A customer with valid email address
        Initialize();
        CreateTestCustomer(Customer);
        ValidEmail := CreateValidEmailAddress();
        
        // [WHEN] Email field is validated
        Customer.Validate("E-Mail", ValidEmail);
        
        // [THEN] Email is accepted without error
        LibraryAssert.AreEqual(ValidEmail, Customer."E-Mail", EmailValidMsg);
    end;

    /// <summary>
    /// Test: Invalid email format should raise error
    /// </summary>
    [Test]
    procedure TestValidateEmail_InvalidFormat_RaisesError()
    var
        InvalidEmail: Text[80];
    begin
        // [SCENARIO] Customer record rejects invalid email format
        
        // [GIVEN] A customer with invalid email address
        Initialize();
        CreateTestCustomer(Customer);
        InvalidEmail := 'not-an-email';
        
        // [WHEN] Email field is validated
        asserterror Customer.Validate("E-Mail", InvalidEmail);
        
        // [THEN] Error is raised
        LibraryAssert.ExpectedError(EmailInvalidErr);
    end;

    /// <summary>
    /// Test: Empty email should be allowed
    /// </summary>
    [Test]
    procedure TestValidateEmail_EmptyString_Allowed()
    begin
        // [SCENARIO] Customer record allows empty email
        
        // [GIVEN] A customer
        Initialize();
        CreateTestCustomer(Customer);
        
        // [WHEN] Email is set to empty
        Customer.Validate("E-Mail", '');
        
        // [THEN] No error occurs
        LibraryAssert.AreEqual('', Customer."E-Mail", 'Empty email should be allowed');
    end;

    local procedure Initialize()
    begin
        if IsInitialized then
            exit;
        
        // Setup code here
        IsInitialized := true;
        Commit();
    end;

    local procedure CreateTestCustomer(var Customer: Record Customer)
    begin
        Customer.Init();
        Customer."No." := LibraryRandom.RandText(20);
        Customer.Name := LibraryRandom.RandText(50);
        Customer.Insert(true);
    end;

    local procedure CreateValidEmailAddress(): Text[80]
    begin
        exit(LibraryRandom.RandText(10) + '@example.com');
    end;
}
