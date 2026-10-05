import { StyleSheet, Text, useWindowDimensions } from 'react-native';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { WEB_COLUMN } from '@/config/web-layout';
import { AppFrame as WebFrame, useFrameWidth as useWebFrameWidth } from '../AppFrame.web';

// The phone file (ESLint's resolver would map '../AppFrame' to the .web file; Jest doesn't).
const { AppFrame: PhoneFrame, useFrameWidth: usePhoneFrameWidth } =
  require('../AppFrame') as typeof import('../AppFrame');

function Widths() {
  const window = useWindowDimensions().width;
  return <Text>{`${window}|${useWebFrameWidth()}|${usePhoneFrameWidth()}`}</Text>;
}

describe('app frame', () => {
  it('web: the app sits in a centred column no wider than WEB_COLUMN', () => {
    const { toJSON } = render(
      <ThemeProvider>
        <WebFrame>
          <Text>app</Text>
        </WebFrame>
      </ThemeProvider>,
    );
    const outer = toJSON() as unknown as { props: { style: unknown }; children: { props: { style: unknown } }[] };
    expect(StyleSheet.flatten(outer.props.style as never)).toMatchObject({ flex: 1, alignItems: 'center' });
    expect(StyleSheet.flatten(outer.children[0]!.props.style as never)).toMatchObject({
      flex: 1,
      width: '100%',
      maxWidth: WEB_COLUMN,
    });
  });

  it('web lays out in the column on a wide window; phones use the whole screen', () => {
    const { getByText } = render(<Widths />);
    const [window, web, phone] = (getByText(/\|/).props.children as string).split('|').map(Number);
    expect(web).toBe(Math.min(window!, WEB_COLUMN));
    expect(phone).toBe(window);
  });

  it('phone: the frame adds nothing', () => {
    const { toJSON } = render(
      <PhoneFrame>
        <Text>app</Text>
      </PhoneFrame>,
    );
    expect((toJSON() as unknown as { type: string }).type).toBe('Text');
  });
});
