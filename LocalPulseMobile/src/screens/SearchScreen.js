import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, StatusBar,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../config/theme';
import { getCategoryEmoji, getUrgencyColor } from '../utils/helpers';
import apiService from '../services/api';

const CATEGORY_FILTERS = ['All', 'power', 'water', 'event', 'lost', 'jobs', 'emergency', 'general'];
const URGENCY_FILTERS = ['All', 'urgent', 'important', 'normal'];

export default function SearchScreen({ navigation, user }) {
  const [notices, setNotices] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedUrgency, setSelectedUrgency] = useState('All');
  const [showArchived, setShowArchived] = useState(false);

  const fetchNotices = useCallback(async () => {
    const data = await apiService.getNotices();
    setNotices(data || []);
  }, []);

  useEffect(() => {
    fetchNotices();
  }, []);

  const getFiltered = () => {
    const area = (user?.colony || 'Anna Nagar Colony').toLowerCase();
    let base = notices.filter((n) => n.area && n.area.toLowerCase() === area);
    base = showArchived ? base.filter((n) => n.archived) : base.filter((n) => !n.archived);

    return base.filter((n) => {
      const textMatch =
        (n.title || '').toLowerCase().includes(keyword.toLowerCase()) ||
        (n.description || '').toLowerCase().includes(keyword.toLowerCase());
      const catMatch = selectedCategory === 'All' || n.category === selectedCategory;
      const urgMatch = selectedUrgency === 'All' || n.urgency === selectedUrgency;
      return textMatch && catMatch && urgMatch;
    });
  };

  const filtered = getFiltered();

  const renderNotice = ({ item }) => {
    const urgencyColor = getUrgencyColor(item.urgency);
    const catColors = Colors[item.category] || Colors.general;

    return (
      <TouchableOpacity
        style={styles.resultCard}
        onPress={() => navigation.navigate('NoticeDetail', { notice: item, user })}
        activeOpacity={0.7}
      >
        <View style={[styles.resultStrip, { backgroundColor: urgencyColor }]} />
        <View style={styles.resultContent}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
            <View style={[styles.resultBadge, { backgroundColor: catColors.bg }]}>
              <Text style={[styles.resultBadgeText, { color: catColors.text }]}>
                {getCategoryEmoji(item.category)}
              </Text>
            </View>
          </View>
          <View style={styles.resultMeta}>
            <Text style={styles.resultMetaText}>👤 {item.author}</Text>
            <Text style={styles.resultMetaText}>👍 {item.upvotes || 0}</Text>
            {item.archived && <Text style={[styles.resultMetaText, { color: Colors.important }]}>📦 Archived</Text>}
          </View>
        </View>
        <Text style={styles.arrow}>→</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgDark} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔍 Search Notices</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title or description..."
          placeholderTextColor={Colors.textMuted}
          value={keyword}
          onChangeText={setKeyword}
          autoCapitalize="none"
        />
      </View>

      {/* Category Filters */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Category</Text>
        <FlatList
          horizontal
          data={CATEGORY_FILTERS}
          renderItem={({ item: cat }) => (
            <TouchableOpacity
              style={[styles.filterChip, selectedCategory === cat && styles.filterChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.filterChipText, selectedCategory === cat && styles.filterChipTextActive]}>
                {cat === 'All' ? 'All' : `${getCategoryEmoji(cat)} ${cat}`}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {/* Urgency Filters */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Urgency</Text>
        <FlatList
          horizontal
          data={URGENCY_FILTERS}
          renderItem={({ item: urg }) => (
            <TouchableOpacity
              style={[styles.filterChip, selectedUrgency === urg && styles.filterChipActive]}
              onPress={() => setSelectedUrgency(urg)}
            >
              <Text style={[styles.filterChipText, selectedUrgency === urg && styles.filterChipTextActive]}>
                {urg === 'All' ? 'All' : urg.charAt(0).toUpperCase() + urg.slice(1)}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {/* Archive toggle */}
      <TouchableOpacity
        style={styles.archiveToggle}
        onPress={() => setShowArchived(!showArchived)}
      >
        <Text style={styles.archiveToggleText}>
          {showArchived ? '📦 Showing Archived' : '📋 Showing Active'}
        </Text>
        <Text style={styles.archiveToggleSwitch}>Switch →</Text>
      </TouchableOpacity>

      {/* Results count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          RESULTS ({filtered.length})
        </Text>
      </View>

      {/* Results list */}
      <FlatList
        data={filtered}
        renderItem={renderNotice}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔎</Text>
            <Text style={styles.emptyText}>No notices match your search</Text>
          </View>
        }
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
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  searchBox: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  searchInput: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  filterSection: {
    marginBottom: Spacing.sm,
  },
  filterLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  filterList: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  filterChip: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryFaded,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  filterChipTextActive: {
    color: Colors.primaryLight,
  },
  archiveToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  archiveToggleText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  archiveToggleSwitch: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  resultsHeader: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  resultsCount: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 100,
  },
  resultCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultStrip: {
    width: 4,
    height: '100%',
  },
  resultContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  resultTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  resultBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  resultBadgeText: {
    fontSize: 12,
  },
  resultMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  resultMetaText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  arrow: {
    fontSize: FontSize.lg,
    color: Colors.primary,
    paddingRight: Spacing.lg,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.huge,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
});
