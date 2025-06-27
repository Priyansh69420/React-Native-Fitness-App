import React, { createContext, useContext } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { lightTheme, darkTheme, Theme } from '../utils/themes';

const ThemeContext = createContext<Theme>(lightTheme);

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const darkMode = useSelector((state: RootState) => state.user?.userData?.darkMode ?? false);
    const theme = darkMode ? darkTheme : lightTheme;

    return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext);