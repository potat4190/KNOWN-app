/**
 * App entry: Expo Router's documented custom entry (side effects first, the router last).
 *
 * youversion-web must load before anything imports the YouVersion SDK (the theme does), so
 * that on the web it sees the browser's own fetch. On phones it does nothing.
 */
import './src/lib/youversion-web';
import 'expo-router/entry';
