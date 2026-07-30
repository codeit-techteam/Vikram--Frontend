import { useCallback, useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import {
  MembershipBenefitsGrid,
  MembershipFAQ,
  MembershipHeroCard,
  MembershipHowItWorks,
  MembershipPlanCard,
} from '@components/membership';
import {
  MEMBERSHIP_BENEFITS,
  MEMBERSHIP_FAQS,
  MEMBERSHIP_HOW_IT_WORKS,
  MEMBERSHIP_PLANS,
  getPlanById,
  type MembershipPlanId,
} from '@constants/membership';
import { useMembershipStore } from '@store/membershipStore';
import { requireAuth } from '@utils/requireAuth';

export default function MembershipScreen() {
  const isMember = useMembershipStore((s) => s.isMember);
  const currentPlanId = useMembershipStore((s) => s.plan);
  const joinPlan = useMembershipStore((s) => s.joinPlan);
  const clearMembership = useMembershipStore((s) => s.clearMembership);

  const featuredPlan = useMemo(() => {
    if (currentPlanId) {
      return getPlanById(currentPlanId) ?? MEMBERSHIP_PLANS.find((p) => p.popular)!;
    }
    return MEMBERSHIP_PLANS.find((p) => p.popular) ?? MEMBERSHIP_PLANS[0];
  }, [currentPlanId]);

  const handleJoin = useCallback(
    (planId: MembershipPlanId) => {
      if (!requireAuth('Please log in to join membership.')) return;

      const plan = getPlanById(planId);
      if (!plan) return;

      if (isMember && currentPlanId === planId) {
        Alert.alert(
          'Manage Membership',
          'Cancel your current membership? Benefits stay active until expiry in a future release.',
          [
            { text: 'Keep', style: 'cancel' },
            {
              text: 'Cancel Membership',
              style: 'destructive',
              onPress: () => clearMembership(),
            },
          ],
        );
        return;
      }

      Alert.alert(
        `Join ${plan.name}?`,
        `${plan.name} · ₹${plan.annualPrice}/year\n\nPayment will be enabled when backend is ready. Activate locally for now?`,
        [
          { text: 'Not now', style: 'cancel' },
          {
            text: 'Activate',
            onPress: () => {
              joinPlan(planId);
              Alert.alert('Welcome!', `${plan.name} membership is now active.`);
            },
          },
        ],
      );
    },
    [clearMembership, currentPlanId, isMember, joinPlan],
  );

  const scrollToPlans = useCallback(() => {
    handleJoin(featuredPlan.id);
  }, [featuredPlan.id, handleJoin]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BackHeader title="Bajriwala Membership" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <MembershipHeroCard
          plan={featuredPlan}
          isActive={isMember && currentPlanId === featuredPlan.id}
          onJoin={scrollToPlans}
        />

        <Text style={styles.sectionTitle}>Membership Plans</Text>
        <Text style={styles.sectionSubtitle}>
          Choose a plan that fits your construction volume
        </Text>

        {MEMBERSHIP_PLANS.map((plan) => (
          <MembershipPlanCard
            key={plan.id}
            plan={plan}
            selected={isMember && currentPlanId === plan.id}
            onJoin={handleJoin}
          />
        ))}

        <Text style={styles.sectionTitle}>Member Benefits</Text>
        <Text style={styles.sectionSubtitle}>
          Perks that save money on every site order
        </Text>
        <MembershipBenefitsGrid benefits={MEMBERSHIP_BENEFITS} />

        <Text style={styles.sectionTitle}>How It Works</Text>
        <MembershipHowItWorks steps={MEMBERSHIP_HOW_IT_WORKS} />

        <Text style={styles.sectionTitle}>FAQ</Text>
        <MembershipFAQ items={MEMBERSHIP_FAQS} />

        <View style={styles.footerSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  sectionTitle: {
    marginTop: 28,
    marginBottom: 4,
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  sectionSubtitle: {
    marginBottom: 14,
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  footerSpacer: {
    height: 24,
  },
});
