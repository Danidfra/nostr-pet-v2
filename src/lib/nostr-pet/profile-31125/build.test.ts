/**
 * Tests for Blobbonaut Profile Builder
 */

import { describe, it, expect } from 'vitest';
import {
  buildBlobbonautProfileEvent,
  buildBooleanProfileTags,
  createBlobbonautProfile,
} from './build';
import type { BlobbonautProfile } from './types';
import { BLOBBONAUT_PROFILE_TAG_NAMES } from './types';

describe('buildBooleanProfileTags', () => {
  it('should include onboarding_done tag when true', () => {
    const profile = {
      onboardingDone: true,
    } as BlobbonautProfile;

    const tags = buildBooleanProfileTags(profile);

    expect(tags).toHaveLength(1);
    expect(tags[0]).toEqual([BLOBBONAUT_PROFILE_TAG_NAMES.ONBOARDING_DONE, 'true']);
  });

  it('should include onboarding_done tag when false', () => {
    const profile = {
      onboardingDone: false,
    } as BlobbonautProfile;

    const tags = buildBooleanProfileTags(profile);

    // CRITICAL: Should include false values, not skip them
    expect(tags).toHaveLength(1);
    expect(tags[0]).toEqual([BLOBBONAUT_PROFILE_TAG_NAMES.ONBOARDING_DONE, 'false']);
  });

  it('should NOT include onboarding_done tag when undefined', () => {
    const profile = {
      onboardingDone: undefined,
    } as BlobbonautProfile;

    const tags = buildBooleanProfileTags(profile);

    expect(tags).toHaveLength(0);
  });

  it('should NOT include onboarding_done tag when not present', () => {
    const profile = {} as BlobbonautProfile;

    const tags = buildBooleanProfileTags(profile);

    expect(tags).toHaveLength(0);
  });
});

describe('buildBlobbonautProfileEvent', () => {
  it('should include onboarding_done: false in profile event', () => {
    const profile = createBlobbonautProfile({
      ownerPubkey: 'test-pubkey',
      name: 'Test User',
      onboardingDone: false, // Explicitly false
    });

    const event = buildBlobbonautProfileEvent(profile);

    // Find onboarding_done tag
    const onboardingTag = event.tags.find(
      ([name]) => name === BLOBBONAUT_PROFILE_TAG_NAMES.ONBOARDING_DONE
    );

    expect(onboardingTag).toBeDefined();
    expect(onboardingTag).toEqual([BLOBBONAUT_PROFILE_TAG_NAMES.ONBOARDING_DONE, 'false']);
  });

  it('should include onboarding_done: true in profile event', () => {
    const profile = createBlobbonautProfile({
      ownerPubkey: 'test-pubkey',
      name: 'Test User',
      onboardingDone: true,
    });

    const event = buildBlobbonautProfileEvent(profile);

    const onboardingTag = event.tags.find(
      ([name]) => name === BLOBBONAUT_PROFILE_TAG_NAMES.ONBOARDING_DONE
    );

    expect(onboardingTag).toBeDefined();
    expect(onboardingTag).toEqual([BLOBBONAUT_PROFILE_TAG_NAMES.ONBOARDING_DONE, 'true']);
  });

  it('should default to onboarding_done: false when not specified', () => {
    const profile = createBlobbonautProfile({
      ownerPubkey: 'test-pubkey',
      name: 'Test User',
      // onboardingDone not specified (will default to false)
    });

    const event = buildBlobbonautProfileEvent(profile);

    const onboardingTag = event.tags.find(
      ([name]) => name === BLOBBONAUT_PROFILE_TAG_NAMES.ONBOARDING_DONE
    );

    // Should default to false when not specified
    expect(onboardingTag).toBeDefined();
    expect(onboardingTag).toEqual([BLOBBONAUT_PROFILE_TAG_NAMES.ONBOARDING_DONE, 'false']);
  });
});

describe('CRITICAL: Boolean Tag Regression Test', () => {
  it('should preserve onboarding_done: false across profile updates', () => {
    // Create profile with onboardingDone: false
    const initialProfile = createBlobbonautProfile({
      ownerPubkey: 'test-pubkey',
      name: 'New User',
      onboardingDone: false, // User has NOT completed onboarding
    });

    // Build event
    const event = buildBlobbonautProfileEvent(initialProfile);

    // Verify tag is present with false value
    const onboardingTag = event.tags.find(
      ([name]) => name === BLOBBONAUT_PROFILE_TAG_NAMES.ONBOARDING_DONE
    );

    expect(onboardingTag).toBeDefined();
    expect(onboardingTag?.[1]).toBe('false');

    // This is critical: false values must be preserved
    // Otherwise, we can't distinguish between "not set" and "explicitly false"
  });
});
