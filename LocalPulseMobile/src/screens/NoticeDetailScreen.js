import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert,
  StyleSheet, StatusBar,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../config/theme';
import { timeAgo, getExpiresLabel, getCategoryEmoji, getUrgencyColor } from '../utils/helpers';
import apiService from '../services/api';

export default function NoticeDetailScreen({ route, navigation }) {
  const { notice: initialNotice, user } = route.params;
  const [notice, setNotice] = useState(initialNotice);
  const isAdmin = user?.role === 'Admin' || user?.username === 'admin';
  const isUpvoted = notice.upvoted_by && notice.upvoted_by.includes(user?.name);
  const urgencyColor = getUrgencyColor(notice.urgency);
  const catColors = Colors[notice.category] || Colors.general;

  const handleUpvote = async () => {
    const updated = await apiService.upvoteNotice(notice.id, user?.name || 'Resident');
    if (updated) setNotice(updated);
  };

  const handlePin = async () => {
    const updated = await apiService.pinNotice(notice.id);
    if (updated) setNotice(updated);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Notice',
      'Remove this notice permanently?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await apiService.deleteNotice(notice.id);
            navigation.goBack();
          },
        },
      ]
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
        {/* Urgency bar */}
        <View style={[styles.urgencyBar, { backgroundColor: urgencyColor }]} />

        {/* Main content card */}
        <View style={styles.mainCard}>
          {/* Category & Urgency badges */}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: catColors.bg }]}>
              <Text style={[styles.badgeText, { color: catColors.text }]}>
                {getCategoryEmoji(notice.category)} {notice.category.toUpperCase()}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: `${urgencyColor}20` }]}>
              <Text style={[styles.badgeText, { color: urgencyColor }]}>
                {notice.urgency.toUpperCase()}
              </Text>
            </View>
            {notice.pinned && (
              <View style={[styles.badge, { backgroundColor: Colors.importantBg }]}>
                <Text style={[styles.badgeText, { color: Colors.important }]}>📌 PINNED</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={styles.title}>{notice.title}</Text>

          {/* Description */}
          <Text style={styles.description}>{notice.description}</Text>
        </View>

        {/* Info cards */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>👤</Text>
            <Text style={styles.infoLabel}>Author</Text>
            <Text style={styles.infoValue}>{notice.author}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>📞</Text>
            <Text style={styles.infoLabel}>Contact</Text>
            <Text style={styles.infoValue}>{notice.contact || 'N/A'}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>🕐</Text>
            <Text style={styles.infoLabel}>Posted</Text>
            <Text style={styles.infoValue}>{timeAgo(notice.created_at)}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>⏳</Text>
            <Text style={styles.infoLabel}>Expires</Text>
            <Text style={styles.infoValue}>{getExpiresLabel(notice.expires_at)}</Text>
          </View>
        </View>

        {/* Upvote section */}
        <View style={styles.engagementCard}>
          <View style={styles.engagementRow}>
            <View>
              <Text style={styles.engagementTitle}>Community Response</Text>
              <Text style={styles.engagementCount}>
                {notice.upvotes || 0} upvotes
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.upvoteBtn, isUpvoted && styles.upvoteBtnActive]}
              onPress={handleUpvote}
              activeOpacity={0.7}
            >
              <Text style={[styles.upvoteBtnText, isUpvoted && styles.upvoteBtnTextActive]}>
                👍 {isUpvoted ? 'Upvoted' : 'Upvote'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Admin controls */}
        {isAdmin && (
          <View style={styles.adminCard}>
            <Text style={styles.adminTitle}>🛡️ Admin Controls</Text>
            <View style={styles.adminActions}>
              <TouchableOpacity
                style={styles.adminBtn}
                onPress={handlePin}
                activeOpacity={0.7}
              >
                <Text style={styles.adminBtnText}>
                  {notice.pinned ? '📍 Unpin' : '📌 Pin'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.adminBtn, styles.adminDeleteBtn]}
                onPress={handleDelete}
                activeOpacity={0.7}
              >
                <Text style={[styles.adminBtnText, styles.adminDeleteBtnText]}>
                  🗑️ Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Area info */}
        <View style={styles.areaCard}>
          <Text style={styles.areaLabel}>📍 Area</Text>
          <Text style={styles.areaValue}>{notice.area}</Text>
        </View>
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
  urgencyBar: {
    height: 6,
    width: '100%',
  },
  mainCard: {
    backgroundColor: Colors.bgCard,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  badge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 1,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 30,
    marginBottom: Spacing.lg,
  },
  description: {
    fontSize: FontSize.md + 1,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
  },
  infoCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    flex: 1,
    minWidth: '45%',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 22,
    marginBottom: Spacing.sm,
  },
  infoLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  engagementCard: {
    backgroundColor: Colors.bgCard,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  engagementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  engagementTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  engagementCount: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  upvoteBtn: {
    backgroundColor: Colors.bgElevated,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  upvoteBtnActive: {
    backgroundColor: Colors.primaryFaded,
    borderColor: Colors.primary,
  },
  upvoteBtnText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  upvoteBtnTextActive: {
    color: Colors.primaryLight,
  },
  adminCard: {
    backgroundColor: Colors.bgCard,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  adminTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primaryLight,
    marginBottom: Spacing.md,
  },
  adminActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  adminBtn: {
    flex: 1,
    backgroundColor: Colors.primaryFaded,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  adminBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primaryLight,
  },
  adminDeleteBtn: {
    backgroundColor: Colors.urgentBg,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  adminDeleteBtnText: {
    color: Colors.urgentLight,
  },
  areaCard: {
    backgroundColor: Colors.bgCard,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  areaLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  areaValue: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
