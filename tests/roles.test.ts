import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ASSIGNABLE_ROLES, isTeamRole, publicRoleLabel } from '../lib/roles'
import { normalizeNtlId } from '../lib/ntl-id'

test('team roles', () => {
  assert.ok(isTeamRole('core_team') && isTeamRole('volunteer') && isTeamRole('admin'))
  assert.ok(!isTeamRole('member') && !isTeamRole(null))
  assert.ok(!ASSIGNABLE_ROLES.includes('admin'))
  assert.equal(publicRoleLabel('admin'), null)
  assert.equal(publicRoleLabel('core_team'), 'Core team')
})

test('ntl id normalisation', () => {
  assert.equal(normalizeNtlId(' ntl-7k3m-9qx2 '), 'NTL-7K3M-9QX2')
  assert.equal(normalizeNtlId('NTL-123'), null)
  assert.equal(normalizeNtlId('../etc/passwd'), null)
})
