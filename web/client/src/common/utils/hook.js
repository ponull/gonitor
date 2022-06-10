import {useEffect, useRef} from "react";
import useMediaQuery from "@mui/material/useMediaQuery";
import {useTheme} from "@mui/material";

export const useInterval = (callback, delay) => {
    const latestCallback = useRef(() => {
    });

    useEffect(() => {
        latestCallback.current = callback;
    });

    useEffect(() => {
        if (delay !== null) {
            const interval = setInterval(() => latestCallback.current(), delay || 0);
            return () => clearInterval(interval);
        }
        return undefined;
    }, [delay]);
}

export const useScreenSize = () => {
    const theme = useTheme();
    /**
     * ** xs， ** 超小：0px
     * ** sm， **小：600px
     * md, medium: 900px
     * lg, large: 1200px
     * xl, extra-large: 1536px
     * @type {boolean}
     */
    const isMobile = useMediaQuery(theme.breakpoints.between('sm','xs'));
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));   //
    const isWidescreen = useMediaQuery(theme.breakpoints.up('lg'));    //宽屏
    const isFullHD = useMediaQuery(theme.breakpoints.up('xl'));    //全高清
    return {isMobile, isDesktop, isWidescreen, isFullHD};
}