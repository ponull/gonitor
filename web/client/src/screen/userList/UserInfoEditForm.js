import * as React from "react";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import {forwardRef, useState,useImperativeHandle} from "react";

export const UserInfoEditForm = forwardRef((props, ref) => {
    const {userInfo, isAdd} = props
    useImperativeHandle(ref, () => ({
        getFormValues: getFormValues,
    }));
    const getFormValues = () => {
        let userFormValues = {
            username,
            password,
            confirm_password: confirmPassword,
            avatar
        }
        if (isAdd){
            userFormValues.login_account=loginAccount;
        }
        return userFormValues
    }
    const [username, setUsername] = useState(userInfo.username)
    const handleUsernameChange = (event) => setUsername(event.target.value)
    const [loginAccount, setLoginAccount] = useState(userInfo.login_account??"")
    const handleLoginAccountChange = (event) => setLoginAccount(event.target.value)
    const [password, setPassword] = useState(userInfo.password)
    const handlePasswordChange = (event) => setPassword(event.target.value)
    const [confirmPassword, setConfirmPassword] = useState(userInfo.confirm_password)
    const handleConfirmPasswordChange = (event) => setConfirmPassword(event.target.value)
    const [avatar, setAvatar] = useState(userInfo.avatar)
    const handleAvatarChange = (event) => setAvatar(event.target.value)
    return (
        <React.Fragment>
            <Typography variant="h6" gutterBottom>
                Task Info
            </Typography>
            <Grid container spacing={3} sx={{mb: 5}}>
                <Grid item xs={12}>
                    <TextField
                        required
                        name="username"
                        label="Name"
                        value={username}
                        onChange={handleUsernameChange}
                        fullWidth
                        variant="standard"
                    />
                </Grid>
                {
                    isAdd?
                        <Grid item xs={12}>
                            <TextField
                                required
                                name="login_account"
                                label="Login Account"
                                value={loginAccount}
                                onChange={handleLoginAccountChange}
                                fullWidth
                                variant="standard"
                            />
                        </Grid>
                        :""
                }
                <Grid item xs={12}>
                    <TextField
                        required
                        name="password"
                        label="Password"
                        value={password}
                        onChange={handlePasswordChange}
                        fullWidth
                        variant="standard"
                        type="password"
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        required
                        name="confirm_password"
                        label="Confirm Password"
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        fullWidth
                        variant="standard"
                        type="password"
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        required
                        name="avatar"
                        label="Avatar Url(not support upload)"
                        value={avatar}
                        onChange={handleAvatarChange}
                        fullWidth
                        variant="standard"
                    />
                </Grid>
            </Grid>
        </React.Fragment>
    )
})