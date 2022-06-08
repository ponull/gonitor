import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import * as React from "react";

export const InfoItem = ({title, value}) => {
    return (
        <Grid item xs={12}>
            <Grid container spacing={1}>
                <Grid item xs={4} sx={{textAlign:"right"}}>
                    <Typography component="span" variant="p" color="primary" gutterBottom>
                        {title}
                    </Typography>
                </Grid>
                <Grid item xs={8} sx={{textAlign: "left", fontSize: 14}}>
                    <Typography component="span" variant="p" color="inherit" gutterBottom>
                        {value}
                    </Typography>
                </Grid>
            </Grid>
        </Grid>
    );
}