/** Line icons from the Design Lab (ICON / ICO), drawn with react-native-svg. */
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { I18nManager } from 'react-native';

export type IconName =
  | 'help'
  | 'gear'
  | 'x'
  | 'lock'
  | 'spark'
  | 'keep'
  | 'reach'
  | 'sit'
  | 'pause'
  | 'end'
  | 'pics'
  | 'chevron'
  | 'back'
  | 'speaker'
  | 'speakerOff'
  | 'home'
  | 'moments'
  | 'more'
  | 'check';

export function Icon({
  name,
  size = 24,
  color,
  mirror,
}: {
  name: IconName;
  size?: number;
  color: string;
  mirror?: boolean;
}) {
  const flip = mirror ?? (name === 'chevron' || name === 'back');
  const sw = name === 'x' || name === 'chevron' || name === 'back' || name === 'check' ? 2 : 1.8;
  const common = {
    stroke: color,
    strokeWidth: sw,
    fill: 'none',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={flip && I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {name === 'help' && (
        <>
          <Circle cx={12} cy={12} r={9} {...common} />
          <Circle cx={12} cy={12} r={3.6} {...common} />
          <Path d="M5.6 5.6l3.9 3.9M14.5 14.5l3.9 3.9M18.4 5.6l-3.9 3.9M9.5 14.5l-3.9 3.9" {...common} />
        </>
      )}
      {name === 'gear' && (
        <>
          <Circle cx={12} cy={12} r={3.2} {...common} />
          <Path
            d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"
            {...common}
          />
        </>
      )}
      {name === 'x' && <Path d="M6 6l12 12M18 6L6 18" {...common} />}
      {name === 'end' && <Path d="M6 6l12 12M18 6L6 18" {...common} />}
      {name === 'lock' && (
        <>
          <Rect x={5} y={11} width={14} height={9} rx={2} {...common} />
          <Path d="M8 11V8a4 4 0 0 1 8 0v3" {...common} />
        </>
      )}
      {name === 'spark' && (
        <Path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" {...common} />
      )}
      {name === 'keep' && <Path d="M7 4h10v16l-5-4-5 4z" {...common} />}
      {name === 'reach' && (
        <Path
          d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5z"
          {...common}
        />
      )}
      {name === 'sit' && <Path d="M3 9h11a3 3 0 1 0-3-3M3 15h15a3 3 0 1 1-3 3M3 12h8" {...common} />}
      {name === 'pause' && <Path d="M9 6v12M15 6v12" {...common} />}
      {name === 'pics' && (
        <>
          <Rect x={4} y={4} width={7} height={7} rx={2} {...common} />
          <Rect x={13} y={4} width={7} height={7} rx={2} {...common} />
          <Rect x={4} y={13} width={7} height={7} rx={2} {...common} />
          <Rect x={13} y={13} width={7} height={7} rx={2} {...common} />
        </>
      )}
      {name === 'chevron' && <Path d="M9 5l7 7-7 7" {...common} />}
      {name === 'back' && <Path d="M15 5l-7 7 7 7" {...common} />}
      {name === 'check' && <Path d="M5 12.5l4.5 4.5L19 7.5" {...common} />}
      {name === 'speaker' && (
        <>
          <Path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" {...common} />
          <Path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" {...common} />
        </>
      )}
      {name === 'speakerOff' && (
        <>
          <Path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" {...common} />
          <Path d="M16 9.5l5 5M21 9.5l-5 5" {...common} />
        </>
      )}
      {name === 'home' && <Path d="M4 11l8-6.5 8 6.5V20h-5.5v-5h-5v5H4z" {...common} />}
      {name === 'moments' && <Path d="M7 4h10v16l-5-4-5 4z" {...common} />}
      {name === 'more' && (
        <>
          <Circle cx={5.5} cy={12} r={1.4} {...common} />
          <Circle cx={12} cy={12} r={1.4} {...common} />
          <Circle cx={18.5} cy={12} r={1.4} {...common} />
        </>
      )}
    </Svg>
  );
}
