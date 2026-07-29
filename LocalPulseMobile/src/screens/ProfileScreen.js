import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, Alert, Switch,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../config/theme';
import apiService from '../services/api';

export default function ProfileScreen({ user, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [notices, setNotices] = useState([]);
  const [activities, setActivities] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [editArea, setEditArea] = useState('');

  const fetchData = useCallback(async () => {
    const [p, n, a] = await Promise.all([
      apiService.getProfile(),
      apiService.getNotices(),
      apiService.getActivities(),
    ]);
    if (p) {
      setProfile(p);
      setEditNickname(p.nickname || '');
      setEditArea(p.area || '');
    }
    setNotices(n || []);
    setActivities(a || []);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveProfile = async () => {
    if (!editNickname.trim() || !editArea.trim()) {
      Alert.alert('Error', 'Nickname and area are required.');
      return;
    }
    await apiService.updateProfile({
      nickname: editNickname.trim(),
      area: editArea.trim(),
    });
    setEditMode(false);
    fetchData();
    Alert.alert('Success', 'Profile updated!');
  };

  const displayName = user?.name || profile?.nickname || 'Resident';
  const myPosts = notices.filter((n) => n.author === displayName);
  const myUpvotes = notices.filter(
    (n) => n.upvoted_by && n.upvoted_by.includes(displayName)
  );

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
          <Text style={styles.headerTitle}>👤 My Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileRole}>
                {user?.role || profile?.role || 'Resident'} ({user?.id || 'N/A'})
              </Text>
              <Text style={styles.profileArea}>
                📍 {user?.colony || profile?.area || 'Anna Nagar Colony'}
              </Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{myPosts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={[styles.statBox, styles.statBoxMiddle]}>
              <Text style={styles.statNumber}>{myUpvotes.length}</Text>
              <Text style={styles.statLabel}>Upvoted</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>
                {notices.filter((n) => !n.archived).length}
              </Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
          </View>
        </View>

        {/* Edit Profile */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>✏️ Profile Details</Text>
            <TouchableOpacity onPress={() => setEditMode(!editMode)}>
              <Text style={styles.editToggle}>
                {editMode ? 'Cancel' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>

          {editMode ? (
            <View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nickname</Text>
                <TextInput
                  style={styles.input}
                  value={editNickname}
                  onChangeText={setEditNickname}
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Area / Colony</Text>
                <TextInput
                  style={styles.input}
                  value={editArea}
                  onChangeText={setEditArea}
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveProfile}
                activeOpacity={0.8}
              >
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Secure ID</Text>
                <Text style={styles.infoValue}>
                  {user?.id || 'N/A'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>
                  {user?.email || 'N/A'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>
                  {user?.phone || 'N/A'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nickname</Text>
                <Text style={styles.infoValue}>
                  {profile?.nickname || displayName}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Area</Text>
                <Text style={styles.infoValue}>
                  {profile?.area || user?.colony || 'N/A'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* My Notices */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>📝 My Notices</Text>
          {myPosts.length === 0 ? (
            <Text style={styles.emptyText}>You haven't posted any notices yet.</Text>
          ) : (
            myPosts.slice(0, 5).map((n) => (
              <View key={n.id} style={styles.activityRow}>
                <Text style={styles.activityAction} numberOfLines={1}>
                  {n.title}
                </Text>
                <Text style={styles.activityMeta}>👍 {n.upvotes || 0}</Text>
              </View>
            ))
          )}
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>📊 Recent Activity</Text>
          {activities.length === 0 ? (
            <Text style={styles.emptyText}>No recent activity.</Text>
          ) : (
            activities.slice(0, 5).map((act, index) => (
              <View key={act.id || index} style={styles.activityRow}>
                <Text style={styles.activityAction} numberOfLines={1}>
                  {act.action}
                </Text>
                <Text style={styles.activityMeta}>
                  {new Date(act.timestamp).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => {
            Alert.alert('Logout', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Logout', style: 'destructive', onPress: onLogout },
            ]);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutBtnText}>🚪 Logout</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          LocalPulse Mobile v1.0 • React Native + Expo
        </Text>
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
    paddingBottom: 100,
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
  profileCard: {
    backgroundColor: Colors.bgCard,
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  profileRole: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primaryLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  profileArea: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: Colors.bgElevated,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  statBoxMiddle: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.border,
  },
  statNumber: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: Colors.bgCard,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  editToggle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  infoValue: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  activityAction: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
    marginRight: Spacing.md,
  },
  activityMeta: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  logoutBtn: {
    backgroundColor: Colors.urgentBg,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xxl,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutBtnText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.urgentLight,
  },
  footerText: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: Colors.textFaint,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xl,
  },
});
