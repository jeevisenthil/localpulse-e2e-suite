import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, FlatList,
  StyleSheet, StatusBar, Alert,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../config/theme';
import { getCategoryEmoji, getUrgencyColor } from '../utils/helpers';
import apiService from '../services/api';

export default function AdminScreen({ user }) {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotices = useCallback(async () => {
    const data = await apiService.getNotices();
    setNotices(data || []);
  }, []);

  useEffect(() => {
    fetchNotices();
  }, []);

  const activeNotices = notices.filter((n) => !n.archived);
  const pinnedCount = notices.filter((n) => n.pinned && !n.archived).length;
  const urgentCount = notices.filter((n) => n.urgency === 'urgent' && !n.archived).length;
  const totalUpvotes = notices.reduce((sum, n) => sum + (n.upvotes || 0), 0);
  const archivedCount = notices.filter((n) => n.archived).length;

  const handlePin = async (id) => {
    await apiService.pinNotice(id);
    fetchNotices();
  };

  const handleDelete = (id, title) => {
    Alert.alert(
      'Delete Notice',
      `Permanently remove "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await apiService.deleteNotice(id);
            fetchNotices();
          },
        },
      ]
    );
  };

  const handleMockAlert = async (type) => {
    setLoading(true);
    await apiService.triggerMockAlert(type);
    setLoading(false);
    fetchNotices();
    Alert.alert('Alert Sent', `Mock ${type} alert published to the board.`);
  };

  const handleArchiveCheck = async () => {
    const result = await apiService.triggerArchiveCheck();
    if (result) {
      fetchNotices();
      Alert.alert('Archive Check', `${result.expiredCount} notices archived. Total: ${result.totalArchived}`);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Database',
      'This will restore all data to defaults. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await apiService.resetDatabase();
            fetchNotices();
            Alert.alert('Done', 'Database reset to seed data.');
          },
        },
      ]
    );
  };

  const renderNoticeAdmin = ({ item }) => {
    const urgencyColor = getUrgencyColor(item.urgency);
    const catColors = Colors[item.category] || Colors.general;

    return (
      <View style={styles.adminCard}>
        <View style={[styles.adminStrip, { backgroundColor: urgencyColor }]} />
        <View style={styles.adminContent}>
          <View style={styles.adminHeader}>
            <Text style={styles.adminTitle} numberOfLines={1}>{item.title}</Text>
            <View style={[styles.adminBadge, { backgroundColor: catColors.bg }]}>
              <Text style={[styles.adminBadgeText, { color: catColors.text }]}>
                {getCategoryEmoji(item.category)}
              </Text>
            </View>
          </View>
          <Text style={styles.adminMeta}>
            By: {item.author} • 👍 {item.upvotes || 0} {item.pinned ? '• 📌 Pinned' : ''}
          </Text>
          <View style={styles.adminActions}>
            <TouchableOpacity
              style={styles.adminActionBtn}
              onPress={() => handlePin(item.id)}
            >
              <Text style={styles.adminActionText}>
                {item.pinned ? '📍 Unpin' : '📌 Pin'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.adminActionBtn, styles.adminDeleteBtn]}
              onPress={() => handleDelete(item.id, item.title)}
            >
              <Text style={[styles.adminActionText, styles.adminDeleteText]}>
                🗑️ Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgDark} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🛡️ Admin Panel</Text>
          <Text style={styles.headerSubtitle}>Manage notices & community board</Text>
        </View>

        {/* Stats Dashboard */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.primary }]}>{activeNotices.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.important }]}>{pinnedCount}</Text>
            <Text style={styles.statLabel}>Pinned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.urgent }]}>{urgentCount}</Text>
            <Text style={styles.statLabel}>Urgent</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.accent }]}>{totalUpvotes}</Text>
            <Text style={styles.statLabel}>Upvotes</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>

          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => handleMockAlert('power')}
              disabled={loading}
            >
              <Text style={styles.actionEmoji}>⚡</Text>
              <Text style={styles.actionLabel}>Power Alert</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => handleMockAlert('water')}
              disabled={loading}
            >
              <Text style={styles.actionEmoji}>💧</Text>
              <Text style={styles.actionLabel}>Water Alert</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleArchiveCheck}
            >
              <Text style={styles.actionEmoji}>📦</Text>
              <Text style={styles.actionLabel}>Archive Check</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, styles.dangerActionCard]}
              onPress={handleReset}
            >
              <Text style={styles.actionEmoji}>🔄</Text>
              <Text style={[styles.actionLabel, { color: Colors.urgentLight }]}>Reset DB</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notice Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            📋 All Notices ({activeNotices.length} active, {archivedCount} archived)
          </Text>
        </View>

        {activeNotices.map((notice) => (
          <View key={notice.id} style={{ paddingHorizontal: Spacing.xl }}>
            {renderNoticeAdmin({ item: notice })}
          </View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
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
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    flex: 1,
    minWidth: '40%',
  },
  dangerActionCard: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: Colors.urgentBg,
  },
  actionEmoji: {
    fontSize: 28,
    marginBottom: Spacing.sm,
  },
  actionLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  adminCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  adminStrip: {
    height: 3,
  },
  adminContent: {
    padding: Spacing.lg,
  },
  adminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  adminTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  adminBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  adminBadgeText: {
    fontSize: 14,
  },
  adminMeta: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  adminActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  adminActionBtn: {
    flex: 1,
    backgroundColor: Colors.primaryFaded,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  adminActionText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primaryLight,
  },
  adminDeleteBtn: {
    backgroundColor: Colors.urgentBg,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  adminDeleteText: {
    color: Colors.urgentLight,
  },
});
