import React from 'react';
import { View, Text, Button, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

const templatePacks = [
  {
    id: 'tech',
    name: 'Tech Entrepreneur',
    description: 'Startup news, tech trends, business insights',
    feeds: [
      { type: 'rss', url: 'https://techcrunch.com/feed/' },
      { type: 'reddit', url: 'r/startups' },
      { type: 'youtube', url: 'UCVHFbqXqoYvEWM1Ddxl0QDg' },
    ],
  },
  {
    id: 'adhd',
    name: 'ADHD Focus',
    description: 'Productivity tips, focus techniques, ND-friendly content',
    feeds: [
      { type: 'reddit', url: 'r/ADHD' },
      { type: 'rss', url: 'https://www.additudemag.com/feed/' },
    ],
  },
  {
    id: 'dev',
    name: 'Developer Daily',
    description: 'Programming tutorials, tech news, developer discussions',
    feeds: [
      { type: 'rss', url: 'https://dev.to/feed' },
      { type: 'reddit', url: 'r/programming' },
      { type: 'youtube', url: 'UCsBjURrPoezykLs9EqgamOA' },
    ],
  },
];

export default function TemplatePackSelector({ onAddPack, disabled }: { onAddPack: (feeds: any[]) => void, disabled?: boolean }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Template Packs</Text>
      <FlatList
        data={templatePacks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.pack}>
            <Text style={styles.packName}>{item.name}</Text>
            <Text style={styles.packDesc}>{item.description}</Text>
            <Button
              title="Add Pack"
              onPress={() => onAddPack(item.feeds)}
              disabled={disabled}
            />
          </View>
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 16 },
  title: { fontWeight: 'bold', fontSize: 18, marginBottom: 8 },
  pack: { padding: 16, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginRight: 12, backgroundColor: '#fff', width: 220 },
  packName: { fontWeight: 'bold', fontSize: 16 },
  packDesc: { fontSize: 14, color: '#555', marginBottom: 8 },
}); 