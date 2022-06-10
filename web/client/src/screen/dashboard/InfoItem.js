import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import * as React from "react";
import {styled} from "@mui/material/styles";

export const InfoItem = ({title, value}) => {
    return (
        <Grid item xs={12}>
            <Grid container>
                <Grid item md={4}>
                    <Title component="div" variant="p" color="primary" sx={{textAlign: "left"}}>{title}</Title>
                </Grid>
                <Grid item md={8}>
                    <Value component="div" variant="p" color="inherit" sx={{textAlign: "left"}}>{value}</Value>
                </Grid>
            </Grid>
        </Grid>
    );
}

const Title = styled(Typography)(({ theme }) => ({
    [theme.breakpoints.down('md')]: {
        fontSize: 12,
    },
    [theme.breakpoints.up('md')]: {
        fontSize: 16,
    },
}));


const Value = styled(Typography)(({ theme }) => ({
    [theme.breakpoints.down('md')]: {
        fontSize: 10,
        marginLeft: 3
    },
    [theme.breakpoints.up('md')]: {
        fontSize: 16,
    },
}));


