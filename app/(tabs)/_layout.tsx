/** Bottom tabs, YouVersion style: icons + labels. */
import { Tabs } from 'expo-router/tabs';
import { useTheme } from '@/theme';
import { useT } from '@/i18n';
import { Icon } from '@/components/Icon';
import { familyFor } from '@/theme/fonts';

export default function TabsLayout() {
  const { c } = useTheme();
  const { t, lang } = useT();
  const font = familyFor(lang, 'ui', 'medium');
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.text,
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: { backgroundColor: c.background, borderTopColor: c.border, minHeight: 60 },
        tabBarLabelStyle: { fontSize: 12, ...(font ? { fontFamily: font } : {}) },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tab_home'),
          tabBarIcon: ({ color }) => <Icon name="home" color={color as string} />,
          tabBarButtonTestID: 'tab-home',
        }}
      />
      <Tabs.Screen
        name="moments"
        options={{
          title: t('moments_title'),
          tabBarIcon: ({ color }) => <Icon name="moments" color={color as string} />,
          tabBarButtonTestID: 'tab-moments',
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t('tab_more'),
          tabBarIcon: ({ color }) => <Icon name="more" color={color as string} />,
          tabBarButtonTestID: 'tab-more',
        }}
      />
    </Tabs>
  );
}
