import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Animated, StatusBar,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../config/theme';
import { timeAgo, getExpiresLabel, getCategoryEmoji, getUrgencyColor } from '../utils/helpers';
import apiService from '../services/api';

export default function FeedScreen({ navigation, user }) {
  const [notices, setNotices] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchNotices = useCallback(async () => {
    const data = await apiService.getNotices();
    setNotices(data || []);
  }, []);

  useEffect(() => {
    fetchNotices();
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    const interval = setInterval(fetchNotices, 10000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotices();
    setRefreshing(false);
  };

  const handleUpvote = async (id) => {
    await apiService.upvoteNotice(id, user?.name || 'Resident');
    fetchNotices();
  };

  const getFilteredNotices = () => {
    const area = (user?.colony || 'Anna Nagar Colony').toLowerCase();
    let filtered = notices.filter(
      (n) => !n.archived && n.area && n.area.toLowerCase() === area
    );

    if (activeTab === 'Pinned') {
      filtered = filtered.filter((n) => n.pinned);
    } else if (activeTab === 'Urgent') {
      filtered = filtered.filter((n) => n.urgency === 'urgent');
    }

    return filtered;
  };

  const urgentCount = notices.filter(
    (n) => n.urgency === 'urgent' && !n.archived
  ).length;

  const renderNoticeCard = ({ item, index }) => {
    const urgencyColor = getUrgencyColor(item.urgency);
    const catColors = Colors[item.category] || Colors.general;
    const isUpvotedByMe = item.upvoted_by && item.upvoted_by.includes(user?.name);

    return (
      <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
        {/* Urgency indicator strip */}
        <View style={[styles.urgencyStrip, { backgroundColor: urgencyColor }]} />

        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => navigation.navigate('NoticeDetail', { notice: item, user })}
          activeOpacity={0.7}
        >
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              {item.pinned && <Text style={styles.pinIcon}>📌</Text>}
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>
            </View>
            <View style={[styles.categoryBadge, { backgroundColor: catColors.bg }]}>
              <Text style={[styles.categoryBadgeText, { color: catColors.text }]}>
                {getCategoryEmoji(item.category)} {item.category.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.description}
          </Text>

          {/* Meta row */}
          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>👤 {item.author}</Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>🕐 {timeAgo(item.created_at)}</Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>⏳ {getExpiresLabel(item.expires_at)}</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.upvoteBtn, isUpvotedByMe && styles.upvoteBtnActive]}
              onPress={() => handleUpvote(item.id)}
            >
              <Text
                style={[styles.upvoteBtnText, isUpvotedByMe && styles.upvoteBtnTextActive]}
              >
                👍 {item.upvotes || 0}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.detailBtn}
              onPress={() => navigation.navigate('NoticeDetail', { notice: item, user })}
            >
              <Text style={styles.detailBtnText}>View Details →</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const filteredNotices = getFilteredNotices();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgDark} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🏘️ Notice Board V2</Text>
          <Text style={styles.headerSubtitle}>{user?.colony || 'Anna Nagar Colony'}</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{filteredNotices.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          {urgentCount > 0 && (
            <View style={[styles.statChip, styles.urgentChip]}>
              <Text style={[styles.statValue, { color: Colors.urgent }]}>{urgentCount}</Text>
              <Text style={[styles.statLabel, { color: Colors.urgentLight }]}>Urgent</Text>
            </View>
          )}
        </View>
      </View>

      {/* Urgent banner */}
      {urgentCount > 0 && (
        <TouchableOpacity
          style={styles.urgentBanner}
          onPress={() => setActiveTab('Urgent')}
        >
          <Text style={styles.urgentBannerText}>
            🚨 {urgentCount} urgent notice{urgentCount > 1 ? 's' : ''} need attention
          </Text>
        </TouchableOpacity>
      )}

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {['All', 'Pinned', 'Urgent'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notice list */}
      <FlatList
        data={filteredNotices}
        renderItem={renderNoticeCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>No notices found</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab !== 'All' ? `No ${activeTab.toLowerCase()} notices` : 'The board is clear!'}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statChip: {
    backgroundColor: Colors.primaryFaded,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  urgentChip: {
    backgroundColor: Colors.urgentBg,
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.primaryLight,
    fontWeight: '600',
  },
  urgentBanner: {
    backgroundColor: Colors.urgentBg,
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  urgentBannerText: {
    color: Colors.urgentLight,
    fontSize: FontSize.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.primaryFaded,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.primaryLight,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  urgencyStrip: {
    height: 4,
    width: '100%',
  },
  cardContent: {
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  cardTitleRow: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
    gap: 4,
  },
  pinIcon: {
    fontSize: 14,
    marginTop: 2,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 22,
  },
  categoryBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  categoryBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cardDesc: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  metaPill: {
    backgroundColor: Colors.bgElevated,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 1,
  },
  metaPillText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  upvoteBtn: {
    backgroundColor: Colors.bgElevated,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  upvoteBtnActive: {
    backgroundColor: Colors.primaryFaded,
  },
  upvoteBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  upvoteBtnTextActive: {
    color: Colors.primaryLight,
  },
  detailBtn: {
    paddingVertical: Spacing.sm,
  },
  detailBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.huge,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
});
