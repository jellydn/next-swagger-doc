// import original module declarations
import type {
  ITheme,
  DefaultTheme as XStyledDefaultTheme,
} from '@xstyled/styled-components';
import '@xstyled/system';
import 'styled-components';

interface AppTheme extends ITheme, XStyledDefaultTheme {
  /* Customize your theme */
}

// and extend them!
declare module '@xstyled/system' {
  export interface Theme extends AppTheme {}
}
declare module 'styled-components' {
  export interface DefaultTheme extends AppTheme {}
}
