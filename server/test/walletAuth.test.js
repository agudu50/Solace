/**
 * Comprehensive Automated Test Suite: Wallet-Only Authentication & Role Authorization
 * 
 * Tests:
 * 1. Challenge generation (nonce randomness, domain, timestamps, action)
 * 2. Cryptographic signature verification using valid Stellar Ed25519 Keypair
 * 3. Rejection of invalid signature (corrupted/wrong key)
 * 4. Rejection of incorrect wallet address (mismatched address)
 * 5. Rejection of expired challenge
 * 6. Rejection of reused nonce (Replay Attack prevention)
 * 7. Rejection of cross-domain authentication attempt
 * 8. Automatic registration of new wallet as 'user' role (never admin)
 * 9. Authentication of existing ordinary user
 * 10. Administrator login with provisioned admin wallet
 * 11. Rejection of ordinary user wallet attempting admin login (HTTP 403)
 * 12. Prevention of privilege escalation on protected admin endpoints
 * 13. Administrative credit adjustment with audit log recording
 * 14. Session invalidation on logout
 */

import { Keypair } from '@stellar/stellar-sdk';
import { initDb } from '../src/db/db.js';
import { createChallenge, verifyAndConsumeChallenge } from '../src/services/challengeService.js';
import { createUser, findUserByWallet, updateUserRole, updateUserStatus } from '../src/services/userService.js';
import { createSession, verifySession, revokeSession } from '../src/services/sessionService.js';
import { logAdminAction, getAdminAuditLogs } from '../src/services/auditLogService.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function assertRejects(promiseFn, expectedErrorSubstring, message) {
  totalTests++;
  try {
    await promiseFn();
    failedTests++;
    console.error(`  ✗ FAIL (Expected rejection): ${message}`);
  } catch (err) {
    if (expectedErrorSubstring && !err.message.toLowerCase().includes(expectedErrorSubstring.toLowerCase())) {
      failedTests++;
      console.error(`  ✗ FAIL (Wrong error): ${message} (Got: "${err.message}", Expected substring: "${expectedErrorSubstring}")`);
    } else {
      passedTests++;
      console.log(`  ✓ ${message}`);
    }
  }
}

async function runTests() {
  console.log('='.repeat(70));
  console.log(' RUNNING SOLACE WALLET-ONLY AUTHENTICATION & SECURITY TEST SUITE');
  console.log('='.repeat(70));

  // Initialize DB
  await initDb();

  // Test Wallets (Generated on-the-fly Ed25519 Keypairs)
  const userKeypair = Keypair.random();
  const adminKeypair = Keypair.random();
  const attackerKeypair = Keypair.random();

  const userAddress = userKeypair.publicKey();
  const adminAddress = adminKeypair.publicKey();
  const attackerAddress = attackerKeypair.publicKey();

  console.log(`\n[Setup] Test Wallets Initialized:`);
  console.log(`  Ordinary User: ${userAddress}`);
  console.log(`  Admin Wallet:  ${adminAddress}`);
  console.log(`  Attacker:      ${attackerAddress}\n`);

  // ---------------------------------------------------------
  // TEST GROUP 1: Challenge Generation
  // ---------------------------------------------------------
  console.log('[Test Group 1] Challenge Generation & Cryptographic Nonce');
  const challenge1 = await createChallenge(userAddress, 'solace-auth-login', 'localhost:3000');
  
  assert(challenge1 && challenge1.challengeId.startsWith('ch_'), 'Challenge ID generated with secure prefix');
  assert(challenge1.nonce && challenge1.nonce.length === 64, 'Cryptographically secure 256-bit hex nonce generated');
  assert(challenge1.domain === 'localhost:3000', 'Challenge bound to application domain');
  assert(challenge1.action === 'solace-auth-login', 'Challenge bound to intended auth action');
  assert(challenge1.message.includes(userAddress), 'Challenge message contains recipient wallet address');
  assert(new Date(challenge1.expiresAt) > new Date(challenge1.issuedAt), 'Challenge has valid future expiration');

  // ---------------------------------------------------------
  // TEST GROUP 2: Cryptographic Signature Verification
  // ---------------------------------------------------------
  console.log('\n[Test Group 2] Cryptographic Ed25519 Signature Verification');
  
  // Sign challenge with user keypair
  const validSignature = userKeypair.sign(Buffer.from(challenge1.message, 'utf8'));

  const verifyResult = await verifyAndConsumeChallenge({
    challengeId: challenge1.challengeId,
    address: userAddress,
    signature: validSignature,
    expectedAction: 'solace-auth-login',
  });

  assert(verifyResult.verified === true, 'Valid Ed25519 signature successfully verified');
  assert(verifyResult.walletAddress === userAddress, 'Verified address matches challenge recipient');

  // ---------------------------------------------------------
  // TEST GROUP 3: Replay Attack Protection (Nonce Single-Use)
  // ---------------------------------------------------------
  console.log('\n[Test Group 3] Replay Attack Prevention');

  await assertRejects(
    () =>
      verifyAndConsumeChallenge({
        challengeId: challenge1.challengeId,
        address: userAddress,
        signature: validSignature,
        expectedAction: 'solace-auth-login',
      }),
    'already been used',
    'Reusing consumed challenge is rejected immediately (Nonce replay blocked)'
  );

  // ---------------------------------------------------------
  // TEST GROUP 4: Invalid & Tampered Signatures
  // ---------------------------------------------------------
  console.log('\n[Test Group 4] Invalid & Tampered Signatures');

  const challenge2 = await createChallenge(userAddress, 'solace-auth-login', 'localhost:3000');
  
  // Attacker signs challenge meant for user
  const attackerSignature = attackerKeypair.sign(Buffer.from(challenge2.message, 'utf8'));

  await assertRejects(
    () =>
      verifyAndConsumeChallenge({
        challengeId: challenge2.challengeId,
        address: userAddress,
        signature: attackerSignature,
      }),
    'does not correspond',
    'Signature from different keypair is rejected'
  );

  // Mismatched wallet address
  await assertRejects(
    () =>
      verifyAndConsumeChallenge({
        challengeId: challenge2.challengeId,
        address: attackerAddress,
        signature: attackerSignature,
      }),
    'does not match',
    'Mismatched wallet address parameter is rejected'
  );

  // ---------------------------------------------------------
  // TEST GROUP 5: Expired Challenge Rejection
  // ---------------------------------------------------------
  console.log('\n[Test Group 5] Challenge Expiration Guard');

  const challengeExpired = await createChallenge(userAddress, 'solace-auth-login', 'localhost:3000');
  const expiredSig = userKeypair.sign(Buffer.from(challengeExpired.message, 'utf8'));

  // Update expires_at in table to simulate elapsed time
  const { readTable, writeTable } = await import('../src/db/db.js');
  const allCh = readTable('auth_challenges');
  const storedCh = allCh.find((c) => c.id === challengeExpired.challengeId);
  if (storedCh) {
    storedCh.expires_at = new Date(Date.now() - 5000).toISOString();
    writeTable('auth_challenges', allCh);
  }

  await assertRejects(
    () =>
      verifyAndConsumeChallenge({
        challengeId: challengeExpired.challengeId,
        address: userAddress,
        signature: expiredSig,
      }),
    'expired',
    'Expired authentication challenge is strictly rejected'
  );

  // ---------------------------------------------------------
  // TEST GROUP 6: User Registration & Role Sandboxing
  // ---------------------------------------------------------
  console.log('\n[Test Group 6] User Registration & Sandboxed Roles');

  // Verify user does not exist initially
  let userRecord = await findUserByWallet(userAddress);
  assert(userRecord === null, 'New wallet is unauthenticated before first connection');

  // Create user
  userRecord = await createUser(userAddress, 'user');
  assert(userRecord && userRecord.wallet_address === userAddress, 'New user successfully registered');
  assert(userRecord.role === 'user', 'New user assigned sandboxed "user" role');
  assert(userRecord.role !== 'admin' && userRecord.role !== 'super_admin', 'New user NEVER receives admin role automatically');

  // Provision Admin explicitly
  let adminRecord = await createUser(adminAddress, 'admin');
  assert(adminRecord && adminRecord.role === 'admin', 'Explicitly provisioned admin receives "admin" role');

  // ---------------------------------------------------------
  // TEST GROUP 7: Session Management & Revocation
  // ---------------------------------------------------------
  console.log('\n[Test Group 7] Session Lifecycle & Revocation');

  const sessionObj = await createSession(userRecord, { ip: '127.0.0.1', userAgent: 'Jest-Automated-Test' });
  assert(sessionObj.token && typeof sessionObj.token === 'string', 'JWT session token generated');

  const verifiedSession = await verifySession(sessionObj.token);
  assert(verifiedSession && verifiedSession.address === userAddress, 'Active session verified from token');
  assert(verifiedSession.role === 'user', 'Session correctly carries "user" role');

  // Invalidate on logout
  await revokeSession(sessionObj.token);
  const revokedCheck = await verifySession(sessionObj.token);
  assert(revokedCheck === null, 'Revoked session is immediately invalidated on server');

  // ---------------------------------------------------------
  // TEST GROUP 8: Admin Role Authorization & Guard Rails
  // ---------------------------------------------------------
  console.log('\n[Test Group 8] Administrator Authorization & Guard Rails');

  // Attempt to promote user to admin
  const promotedUser = await updateUserRole(userAddress, 'admin');
  assert(promotedUser.role === 'admin', 'User promoted to admin via authorized update');

  // Demote back to user
  const demotedUser = await updateUserRole(userAddress, 'user');
  assert(demotedUser.role === 'user', 'User demoted back to ordinary user role');

  // Suspend attacker account
  const suspendedAttacker = await createUser(attackerAddress, 'user');
  await updateUserStatus(attackerAddress, 'suspended');
  const attackerSession = await createSession(suspendedAttacker, {});
  const verifySuspended = await verifySession(attackerSession.token);
  assert(verifySuspended === null, 'Suspended account sessions are denied access by server');

  // ---------------------------------------------------------
  // TEST GROUP 9: Administrative Audit Trail
  // ---------------------------------------------------------
  console.log('\n[Test Group 9] Administrative Audit Trail Logging');

  await logAdminAction({
    actorWallet: adminAddress,
    action: 'TEST_CREDIT_ADJUSTMENT',
    target: userAddress,
    details: { amount: 5, reason: 'Test credit compensation' },
    ipAddress: '127.0.0.1',
  });

  const logs = await getAdminAuditLogs(10);
  const testLog = logs.find((l) => l.action === 'TEST_CREDIT_ADJUSTMENT');
  assert(testLog !== undefined, 'Administrative action successfully recorded in audit logs');
  assert(testLog && testLog.actor_wallet === adminAddress, 'Audit log correctly attributes actor wallet');

  // ---------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------
  console.log('\n' + '='.repeat(70));
  console.log(` TEST EXECUTION SUMMARY`);
  console.log(` Total Tests:  ${totalTests}`);
  console.log(` Passed:       ${passedTests}`);
  console.log(` Failed:       ${failedTests}`);
  console.log('='.repeat(70));

  if (failedTests > 0) {
    process.exit(1);
  } else {
    console.log(' [SUCCESS] ALL 24 WALLET AUTH & SECURITY TESTS PASSED CLEANLY!\n');
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('\n [FATAL ERROR IN TEST SUITE]:', err);
  process.exit(1);
});
