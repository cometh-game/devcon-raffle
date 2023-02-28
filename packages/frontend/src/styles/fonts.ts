import RobotoBoldWoff from './fonts/Roboto/Roboto-Bold.woff'
import RobotoBoldWoff2 from './fonts/Roboto/Roboto-Bold.woff2'
import RobotoMediumWoff from './fonts/Roboto/Roboto-Medium.woff'
import RobotoMediumWoff2 from './fonts/Roboto/Roboto-Medium.woff2'
import RobotoRegularWoff from './fonts/Roboto/Roboto-Regular.woff'
import RobotoRegularWoff2 from './fonts/Roboto/Roboto-Regular.woff2'
import SpaceMonoBoldWoff from './fonts/SpaceMono/SpaceMono-Bold.woff'
import SpaceMonoBoldWoff2 from './fonts/SpaceMono/SpaceMono-Bold.woff2'
import SpaceMonoRegularWoff from './fonts/SpaceMono/SpaceMono-Regular.woff'
import SpaceMonoRegularWoff2 from './fonts/SpaceMono/SpaceMono-Regular.woff2'
import JetbrainsMonoRegular from './fonts/JetBrainsMono/JetBrainsMono-Regular.woff2'
import JetbrainsMonoBold from './fonts/JetBrainsMono/JetBrainsMono-Bold.woff2'


export const fonts = `
  /* Roboto Font Family */

  @font-face {
    font-family: 'Roboto';
    src: url(${RobotoRegularWoff2}) format('woff2'),
        url(${RobotoRegularWoff}) format('woff');
    font-style: normal;
    font-weight: 400;
  }

  @font-face {
    font-family: 'Roboto';
    src: url(${RobotoMediumWoff2}) format('woff2'),
        url(${RobotoMediumWoff}) format('woff');
    font-style: normal;
    font-weight: 500;
  }

  @font-face {
    font-family: 'Roboto';
    src: url(${RobotoBoldWoff}) format('woff2'),
        url(${RobotoBoldWoff2}) format('woff');
    font-style: normal;
    font-weight: 700;
  }

  /* Space Mono Font Family */

  @font-face {
    font-family: 'Space Mono';
    src: url(${SpaceMonoRegularWoff2}) format('woff2'),
        url(${SpaceMonoRegularWoff}) format('woff');
    font-style: normal;
    font-weight: 400;
  }

  @font-face {
    font-family: 'Space Mono';
    src: url(${SpaceMonoBoldWoff}) format('woff2'),
        url(${SpaceMonoBoldWoff2}) format('woff');
    font-style: normal;
    font-weight: 700;
  }

  /* Jetbrains Mono Font Family */

  @font-face {
    font-family: 'Jetbrains Mono';
    src: url(${JetbrainsMonoRegular}) format('woff2');
    font-style: normal:
    font-weight: 400;
  }

  @font-face {
    font-family: 'Jetbrains Mono';
    src: url(${JetbrainsMonoBold}) format('woff2');
    font-style: normal:
    font-weight: 700;
  }
`
