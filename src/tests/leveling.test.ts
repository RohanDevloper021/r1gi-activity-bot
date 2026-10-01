import { describe, it, expect, beforeEach } from 'vitest';
import { XPFormula } from '../services/xp/XPFormula.js';
import { levelService } from '../services/xp/LevelService.js';
import { levelRoleService } from '../services/roles/LevelRoleService.js';
import { levelRoleRepository } from '../repositories/LevelRoleRepository.js';
import { guildConfigRepository } from '../repositories/GuildConfigRepository.js';
import { memoryStore } from '../repositories/memoryStore.js';

describe('Level Progression & Role Rewards System', () => {
  const guildId = 'test-guild-leveling';

  beforeEach(() => {
    memoryStore.clearAll();
  });

  describe('Nonlinear XP Formula', () => {
    it('requires progressively more XP for higher levels', () => {
      const xpLvl1 = XPFormula.getRequiredXP(1);
      const xpLvl2 = XPFormula.getRequiredXP(2);
      const xpLvl5 = XPFormula.getRequiredXP(5);
      const xpLvl10 = XPFormula.getRequiredXP(10);

      expect(xpLvl1).toBeGreaterThan(0);
      expect(xpLvl2 - xpLvl1).toBeGreaterThan(xpLvl1);
      expect(xpLvl5).toBeGreaterThan(xpLvl2);
      expect(xpLvl10).toBeGreaterThan(xpLvl5);
    });

    it('correctly maps total XP back to level', () => {
      const lvl5XP = XPFormula.getRequiredXP(5);
      expect(XPFormula.getLevelFromXP(lvl5XP)).toBe(5);
      expect(XPFormula.getLevelFromXP(lvl5XP + 50)).toBe(5);

      const lvl6XP = XPFormula.getRequiredXP(6);
      expect(XPFormula.getLevelFromXP(lvl6XP)).toBe(6);
    });

    it('calculates level progress percentage accurately (0-100%)', () => {
      const baseLvl5 = XPFormula.getRequiredXP(5);
      const nextLvl6 = XPFormula.getRequiredXP(6);
      const midXP = baseLvl5 + Math.floor((nextLvl6 - baseLvl5) / 2);

      const pct = XPFormula.getProgressPercentage(midXP);
      expect(pct).toBeGreaterThanOrEqual(49);
      expect(pct).toBeLessThanOrEqual(51);
    });

    it('supports progression accurately up to Level 300', () => {
      const xpLvl300 = XPFormula.getRequiredXP(300);
      expect(xpLvl300).toBeGreaterThan(1000000);
      expect(XPFormula.getLevelFromXP(xpLvl300)).toBe(300);
    });
  });

  describe('Customizable Level-Role Management', () => {
    it('allows administrators to configure, edit, and remove milestones without hardcoding', async () => {
      // Add milestone
      await levelRoleRepository.upsert(guildId, 5, 'role-lvl-5');
      await levelRoleRepository.upsert(guildId, 10, 'role-lvl-10');

      let list = await levelRoleRepository.listByGuild(guildId);
      expect(list.length).toBe(2);
      expect(list[0].level).toBe(5);
      expect(list[1].level).toBe(10);

      // Edit milestone
      await levelRoleRepository.upsert(guildId, 5, 'role-lvl-5-updated');
      const updated = await levelRoleRepository.findByGuildAndLevel(guildId, 5);
      expect(updated?.roleId).toBe('role-lvl-5-updated');

      // Remove milestone
      const deleted = await levelRoleRepository.delete(guildId, 5);
      expect(deleted).toBe(true);

      list = await levelRoleRepository.listByGuild(guildId);
      expect(list.length).toBe(1);
      expect(list[0].level).toBe(10);
    });

    it('awards cumulative roles when removePreviousLevelRoles is false', async () => {
      await guildConfigRepository.update(guildId, { removePreviousLevelRoles: false });
      await levelRoleRepository.upsert(guildId, 5, 'role-5');
      await levelRoleRepository.upsert(guildId, 10, 'role-10');

      const addedRoles: string[] = [];
      const mockMember: any = {
        id: 'member-lvl-10',
        guild: {
          id: guildId,
          roles: {
            fetch: async (id: string) => ({ id, name: id, position: 5 }),
          },
          members: {
            me: { permissions: { has: () => true }, roles: { highest: { position: 100 } } },
          },
        },
        roles: {
          cache: new Map(),
          add: async (role: any) => {
            addedRoles.push(role.id);
          },
          remove: async () => {},
        },
      };

      const syncResult = await levelRoleService.processLevelRoles(guildId, mockMember, 10);
      expect(syncResult.addedRoles).toContain('role-5');
      expect(syncResult.addedRoles).toContain('role-10');
    });

    it('removes lower roles when removePreviousLevelRoles is true', async () => {
      await guildConfigRepository.update(guildId, { removePreviousLevelRoles: true });
      await levelRoleRepository.upsert(guildId, 5, 'role-5');
      await levelRoleRepository.upsert(guildId, 10, 'role-10');

      const removedRoles: string[] = [];
      const mockMember: any = {
        id: 'member-lvl-10',
        guild: {
          id: guildId,
          roles: {
            fetch: async (id: string) => ({ id, name: id, position: 5 }),
          },
          members: {
            me: { permissions: { has: () => true }, roles: { highest: { position: 100 } } },
          },
        },
        roles: {
          cache: new Map([['role-5', { id: 'role-5' }]]), // already has role 5
          add: async () => {},
          remove: async (role: any) => {
            removedRoles.push(role.id);
          },
        },
      };

      const syncResult = await levelRoleService.processLevelRoles(guildId, mockMember, 10);
      expect(syncResult.addedRoles).toContain('role-10');
      expect(syncResult.removedRoles).toContain('role-5');
    });
  });
});
