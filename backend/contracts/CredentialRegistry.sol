// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title CredentialRegistry
 * @dev Blockchain credential registry with multi-institution support, DID, trust scores
 */
contract CredentialRegistry {

    // ============== STRUCTS ==============

    struct CredentialRecord {
        string  documentHash;
        string  ipfsCid;
        address issuer;
        address student;
        address institution;
        uint256 issuedAt;
        bool    revoked;
        string  revocationReason;
        uint256 trustScore;
        bool    isDuplicate;
    }

    // Input struct avoids stack-too-deep in issueCredential
    struct IssueParams {
        address student;
        string  documentHash;
        string  ipfsCid;
        address institution;
        uint256 initialTrustScore;
    }

    struct Institution {
        address walletAddress;
        string  name;
        bool    verified;
        bool    active;
        uint256 credentialCount;
    }

    struct DIDocument {
        string  did;
        address wallet;
        string  publicKey;
        bool    active;
        uint256 createdAt;
        uint256 updatedAt;
    }

    struct VerificationRecord {
        address verifier;
        uint256 credentialId;
        uint256 timestamp;
        bool    hashMatched;
        bool    documentMatched;
        uint256 trustScore;
    }

    // ============== STATE VARIABLES ==============

    address public owner;
    uint256 public credentialCount;
    uint256 public institutionCount;

    mapping(uint256 => CredentialRecord)    public credentials;
    mapping(string  => uint256)             public hashToId;
    mapping(address => Institution)         public institutions;
    mapping(string  => DIDocument)          public didRegistry;
    mapping(uint256 => VerificationRecord[]) public verificationHistory;
    mapping(address => uint256)             public userTrustScore;
    mapping(address => bool)                public trustedIssuers;

    uint256 public baselineTrustScore = 750;
    uint256 public fraudThreshold     = 400;

    // ============== EVENTS ==============

    event CredentialIssued(
        uint256 indexed credentialId,
        address indexed issuer,
        address indexed student,
        string  documentHash,
        uint256 trustScore
    );
    event CredentialRevoked(uint256 indexed credentialId, string reason);
    event CredentialVerified(uint256 indexed credentialId, address indexed verifier, uint256 trustScore);
    event InstitutionRegistered(address indexed institutionAddress, string name);
    event InstitutionVerified(address indexed institutionAddress);
    event DIDCreated(string indexed did, address indexed wallet);
    event DIDUpdated(string indexed did, address indexed wallet);
    event TrustScoreUpdated(address indexed user, uint256 newScore);
    event DuplicateDetected(uint256 credentialId1, uint256 credentialId2);
    event FraudAlertTriggered(uint256 indexed credentialId, string reason);

    // ============== MODIFIERS ==============

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier onlyVerifiedIssuer() {
        require(institutions[msg.sender].verified, "Issuer not verified");
        _;
    }

    modifier validCredential(uint256 credentialId) {
        require(credentialId > 0 && credentialId <= credentialCount, "Invalid credential ID");
        _;
    }

    // ============== CONSTRUCTOR ==============

    constructor() {
        owner = msg.sender;
    }

    // ============== INSTITUTION MANAGEMENT ==============

    function registerInstitution(string calldata name, address institutionWallet) external onlyOwner {
        require(bytes(name).length > 0, "Institution name required");
        require(institutionWallet != address(0), "Invalid institution wallet");
        require(!institutions[institutionWallet].active, "Already registered");

        institutions[institutionWallet] = Institution({
            walletAddress:   institutionWallet,
            name:            name,
            verified:        false,
            active:          true,
            credentialCount: 0
        });

        institutionCount++;
        emit InstitutionRegistered(institutionWallet, name);
    }

    function verifyInstitution(address institutionAddress) external onlyOwner {
        require(institutions[institutionAddress].active, "Institution not found");
        institutions[institutionAddress].verified = true;
        trustedIssuers[institutionAddress] = true;
        emit InstitutionVerified(institutionAddress);
    }

    // ============== DID ==============

    function createDID(string calldata did, string calldata publicKey) external {
        require(bytes(did).length > 0, "DID required");
        require(bytes(publicKey).length > 0, "Public key required");
        require(didRegistry[did].wallet == address(0), "DID already exists");

        didRegistry[did] = DIDocument({
            did:       did,
            wallet:    msg.sender,
            publicKey: publicKey,
            active:    true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        emit DIDCreated(did, msg.sender);
    }

    function updateDID(string calldata did, string calldata publicKey) external {
        DIDocument storage d = didRegistry[did];
        require(d.wallet == msg.sender, "Not DID owner");
        require(d.active, "DID not active");
        d.publicKey = publicKey;
        d.updatedAt = block.timestamp;
        emit DIDUpdated(did, msg.sender);
    }

    // ============== CREDENTIAL ISSUANCE ==============

    /**
     * @dev Issue credential — uses IssueParams struct to avoid stack-too-deep
     */
    function issueCredential(IssueParams calldata p) external onlyVerifiedIssuer returns (uint256) {
        require(p.student != address(0), "Invalid student");
        require(bytes(p.documentHash).length > 0, "Hash required");
        require(hashToId[p.documentHash] == 0, "Hash already registered");
        require(bytes(p.documentHash).length == 64, "Hash must be 64 hex chars");
        require(p.institution == msg.sender, "Institution must be the issuer");
        require(institutions[p.institution].verified, "Institution not verified");
        require(p.initialTrustScore <= 1000, "Invalid trust score");

        credentialCount++;
        uint256 id = credentialCount;
        uint256 score = p.initialTrustScore > 0 ? p.initialTrustScore : baselineTrustScore;

        credentials[id] = CredentialRecord({
            documentHash:     p.documentHash,
            ipfsCid:          p.ipfsCid,
            issuer:           msg.sender,
            student:          p.student,
            institution:      p.institution,
            issuedAt:         block.timestamp,
            revoked:          false,
            revocationReason: "",
            trustScore:       score,
            isDuplicate:      false
        });

        hashToId[p.documentHash] = id;
        institutions[p.institution].credentialCount++;

        _setUserTrustScore(p.student, score);

        if (score < fraudThreshold) {
            emit FraudAlertTriggered(id, "Low trust score");
        }

        emit CredentialIssued(id, msg.sender, p.student, p.documentHash, score);
        return id;
    }

    // ============== VERIFICATION ==============

    function verifyCredential(uint256 credentialId)
        external
        view
        validCredential(credentialId)
        returns (bool valid, bool revoked, uint256 trustScore)
    {
        CredentialRecord memory r = credentials[credentialId];
        return (bytes(r.documentHash).length > 0, r.revoked, r.trustScore);
    }

    /**
     * @dev Append an entry to the on-chain verification audit log and adjust the
     *      trust score. Restricted to the contract owner (the EdVault backend
     *      wallet) so third parties cannot forge audit entries or manipulate scores.
     *      The recorded trust score is the post-update value computed on-chain.
     */
    function recordVerification(
        uint256 credentialId,
        bool    hashMatched,
        bool    documentMatched
    ) external onlyOwner validCredential(credentialId) {
        CredentialRecord storage cred = credentials[credentialId];
        require(!cred.revoked, "Credential revoked");

        if (hashMatched && documentMatched) {
            cred.trustScore = _min(cred.trustScore + 50, 1000);
        } else {
            cred.trustScore = _sub(cred.trustScore, 100);
            emit FraudAlertTriggered(credentialId, "Hash or document mismatch");
        }

        verificationHistory[credentialId].push(VerificationRecord({
            verifier:        msg.sender,
            credentialId:    credentialId,
            timestamp:       block.timestamp,
            hashMatched:     hashMatched,
            documentMatched: documentMatched,
            trustScore:      cred.trustScore
        }));

        emit CredentialVerified(credentialId, msg.sender, cred.trustScore);
    }

    function getVerificationCount(uint256 credentialId)
        external
        view
        validCredential(credentialId)
        returns (uint256)
    {
        return verificationHistory[credentialId].length;
    }

    // ============== REVOCATION ==============

    function revokeCredential(uint256 credentialId, string calldata reason)
        external
        onlyOwner
        validCredential(credentialId)
    {
        CredentialRecord storage cred = credentials[credentialId];
        require(!cred.revoked, "Already revoked");
        cred.revoked          = true;
        cred.revocationReason = reason;
        cred.trustScore       = 0;
        emit CredentialRevoked(credentialId, reason);
    }

    // ============== FRAUD ==============

    function markAsDuplicate(uint256 id1, uint256 id2)
        external
        onlyOwner
        validCredential(id1)
        validCredential(id2)
    {
        credentials[id1].isDuplicate = true;
        credentials[id2].isDuplicate = true;
        credentials[id1].trustScore  = _sub(credentials[id1].trustScore, 200);
        credentials[id2].trustScore  = _sub(credentials[id2].trustScore, 200);
        emit DuplicateDetected(id1, id2);
        emit FraudAlertTriggered(id1, "Duplicate detected");
        emit FraudAlertTriggered(id2, "Duplicate detected");
    }

    // ============== TRUST SCORE ==============

    function _setUserTrustScore(address user, uint256 score) internal {
        userTrustScore[user] = score;
        emit TrustScoreUpdated(user, score);
    }

    function getUserTrustScore(address user) external view returns (uint256) {
        return userTrustScore[user] > 0 ? userTrustScore[user] : baselineTrustScore;
    }

    // ============== GETTERS ==============

    function getCredential(uint256 credentialId)
        external
        view
        validCredential(credentialId)
        returns (
            string  memory documentHash,
            string  memory ipfsCid,
            address issuer,
            address student,
            address institution,
            uint256 issuedAt,
            bool    revoked,
            uint256 trustScore,
            bool    isDuplicate
        )
    {
        CredentialRecord memory r = credentials[credentialId];
        return (r.documentHash, r.ipfsCid, r.issuer, r.student, r.institution,
                r.issuedAt, r.revoked, r.trustScore, r.isDuplicate);
    }

    function getVerificationHistory(uint256 credentialId)
        external
        view
        validCredential(credentialId)
        returns (VerificationRecord[] memory)
    {
        return verificationHistory[credentialId];
    }

    function getInstitution(address addr)
        external
        view
        returns (string memory name, bool verified, bool active, uint256 count)
    {
        Institution memory i = institutions[addr];
        return (i.name, i.verified, i.active, i.credentialCount);
    }

    // ============== UTILS ==============

    function _min(uint256 a, uint256 b) private pure returns (uint256) { return a < b ? a : b; }
    /// @dev Saturating subtraction: returns 0 instead of reverting on underflow.
    function _sub(uint256 a, uint256 b) private pure returns (uint256) { return a > b ? a - b : 0; }
}
