import { StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ScaledPressable } from '@components/ScaledPressable';
import { MEMBERSHIP_BRAND, getPlanById } from '@constants/membership';
import { useMembershipStore } from '@store/membershipStore';

interface MembershipBannerProps {
  onPress: () => void;
}

function formatDisplayDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function MembershipLogoMark() {
  return (
    <View style={styles.logoWrap}>
      <View style={styles.goldBadge}>
        <MaterialCommunityIcons name="crown" size={20} color="#1A1A1A" />
      </View>
    </View>
  );
}

/**
 * Compact premium membership strip for Home — below search, above categories.
 */
export function MembershipBanner({ onPress }: MembershipBannerProps) {
  const isMember = useMembershipStore((s) => s.isMember);
  const planId = useMembershipStore((s) => s.plan);
  const memberSince = useMembershipStore((s) => s.memberSince);
  const expiry = useMembershipStore((s) => s.expiry);
  const plan = getPlanById(planId);

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  if (isMember) {
    return (
      <ScaledPressable
        scaleTo={0.98}
        onPress={handlePress}
        style={styles.card}
        accessibilityRole="button"
        accessibilityLabel="Manage Bajriwala Membership">
        <View style={styles.left}>
          <MembershipLogoMark />
          <View style={styles.textCol}>
            <View style={styles.memberTitleRow}>
              <Text style={styles.brandName} numberOfLines={1}>
                {plan?.name ?? MEMBERSHIP_BRAND.shortName}
              </Text>
              <View style={styles.memberPill}>
                <Text style={styles.memberPillText}>MEMBER</Text>
              </View>
            </View>
            <Text style={styles.memberMeta} numberOfLines={1}>
              Since {formatDisplayDate(memberSince)} · Expires {formatDisplayDate(expiry)}
            </Text>
            <Text style={styles.manageLink}>Manage Membership</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#FEB623" />
      </ScaledPressable>
    );
  }

  return (
    <ScaledPressable
      scaleTo={0.98}
      onPress={handlePress}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`Join ${MEMBERSHIP_BRAND.name}`}>
      <View style={styles.left}>
        <MembershipLogoMark />
        <View style={styles.textCol}>
          <Text style={styles.joinLabel}>Join {MEMBERSHIP_BRAND.shortName}</Text>
          <Text style={styles.brandName}>{MEMBERSHIP_BRAND.name}</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {MEMBERSHIP_BRAND.subtitle}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#FEB623" />
    </ScaledPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    minHeight: 96,
    backgroundColor: '#1E1E1E',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 8,
  },
  logoWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEB623',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
  },
  joinLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FEB623',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  brandName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 16,
  },
  memberTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  memberPill: {
    backgroundColor: '#FEB623',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  memberPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  memberMeta: {
    marginTop: 4,
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
  },
  manageLink: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: '#FEB623',
  },
});
