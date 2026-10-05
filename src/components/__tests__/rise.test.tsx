import { StyleSheet, Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { Rise as WebRise } from '../Rise.web';

describe('Rise on the web (Rise.web.tsx)', () => {
  it('plays the entrance as a CSS animation, with no Reanimated layout animation to pin it', () => {
    const { toJSON } = render(
      <ThemeProvider>
        <WebRise index={2}>
          <Text>section</Text>
        </WebRise>
      </ThemeProvider>,
    );
    const view = toJSON() as unknown as { props: { style: unknown; entering?: unknown } };
    expect(view.props.entering).toBeUndefined();
    const style = StyleSheet.flatten(view.props.style as never) as Record<string, unknown>;
    expect(style).toMatchObject({
      animationDuration: '500ms',
      animationDelay: '80ms',
      animationFillMode: 'backwards',
      animationKeyframes: [
        { from: { opacity: 0, transform: [{ translateY: 10 }] }, to: { opacity: 1, transform: [{ translateY: 0 }] } },
      ],
    });
    // Nothing that takes the section out of the page flow.
    expect(style).not.toHaveProperty('position');
    expect(style).not.toHaveProperty('height');
  });
});
