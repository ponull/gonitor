import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {useNavigate} from "react-router-dom";
import httpRequest from "../../common/request/HttpRequest";
import {useSnackbar} from "notistack";

function Copyright(props) {
    return (
        <Typography variant="body2" color="text.secondary" align="center" {...props}>
            {'Copyright © '}
            <Link color="inherit" href="http://www.honghea.com/">
                Honghea
            </Link>{' '}
            {new Date().getFullYear()}
            {'.'}
        </Typography>
    );
}

const theme = createTheme();

export const Login = () => {
    const {enqueueSnackbar} = useSnackbar();
    const handleSubmit = (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        httpRequest.post("/user/login", data)
            .then(res => {
                if (res.code !== 0){
                    enqueueSnackbar(res.message, {variant: "error"});
                    return
                }
                window.localStorage.setItem("token", res.data);
                navigate('/admin');
            })
            .catch(err => {
                enqueueSnackbar("网络错误", {variant: "error"});
            })
        // console.log({
        //     email: data.get('email'),
        //     password: data.get('password'),
        // });
    };
    const navigate = useNavigate();
    // const [loginAccount, setLoginAccount] = React.useState("");
    // const handleLoginAccountChange = (event) => {setLoginAccount(event.target.value)}
    // const [password, setPassword] = React.useState("");
    // const handlePasswordChange = (event) => {setPassword(event.target.value)}

    return (
        <ThemeProvider theme={theme}>
            <Container component="main" maxWidth="xs">
                <CssBaseline />
                <Box
                    sx={{
                        marginTop: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                        <LockOutlinedIcon />
                    </Avatar>
                    <Typography component="h1" variant="h5">
                        Sign in
                    </Typography>
                    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            // value={loginAccount}
                            // onChange={handleLoginAccountChange}
                            label="Login Account"
                            name="login_account"
                            autoFocus
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            // value={password}
                            // onChange={handlePasswordChange}
                            name="password"
                            label="Password"
                            type="password"
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                        >
                            Sign In
                        </Button>
                    </Box>
                </Box>
                <Copyright sx={{ mt: 8, mb: 4 }} />
            </Container>
        </ThemeProvider>
    );
}