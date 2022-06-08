import {Copyright} from "@mui/icons-material";
import Users from "./Users";
import {SystemInfo} from "./System";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import {CpuInfo} from "./CpuInfo";
import {DiskInfo} from "./DiskInfo";
import {MemoryInfo} from "./MemoryInfo";
import {NetInfo} from "./NetInfo";

export const Dashboard = function () {
    return (
        <Container maxWidth="lg" sx={{mt: 4, mb: 4}}>
            <Grid container spacing={3} direction="row">
                {/* System Info */}
                <Grid item xs={12}>
                    <SystemInfo/>
                </Grid>
                <Grid item xs={12}>
                    <CpuInfo/>
                </Grid>
                <Grid item xs={12}>
                    <MemoryInfo/>
                </Grid>
                <Grid item xs={6}>
                    <DiskInfo/>
                </Grid>
                <Grid item xs={6}>
                    <NetInfo/>
                </Grid>
                {/* Recent Orders */}
                <Grid item xs={12}>
                    <Paper sx={{p: 2, display: 'flex', flexDirection: 'column'}}>
                        <Users/>
                    </Paper>
                </Grid>
            </Grid>
            <Copyright sx={{pt: 4}}/>
        </Container>
    );
}