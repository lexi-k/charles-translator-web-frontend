import React, { useState, useEffect } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import {
	AppBar,
	Button,
	IconButton,
	Snackbar,
	Toolbar,
	Tooltip,
	Alert,
} from "@mui/material";
import {
	Check as CheckIcon,
	Close as CloseIcon,
	Info as InfoIcon,
	PhoneAndroid as PhoneAndroidIcon,
} from "@mui/icons-material";

import AboutUsDialog from "./AboutUsDialog";
import SettingsDialog from "./SettingsDialog";
import logo from '../../public/static/img/logo.svg';

import styles from "./layout.module.scss"


function Layout({ children }) {
	const [notOfficialDeplo, setNotOfficialDeplo] = useState(false);
	const [tryAndroidApp, setTryAndroidApp] = useState(false);
	const [state, setState] = useState({
		collectionSnackbar: false,
		collectionSnackbarInfo: false,
	});

	useEffect(() => {
		setState( (prevState) => { return {
			...prevState,
			collectionSnackbar: localStorage.getItem("collectDataConsentValue") === null
		}});
		setNotOfficialDeplo(
			window.location.href.indexOf("lindat.cz/translation") === -1 &&
			window.location.href.indexOf("translator.cuni.cz") === -1
		)
		// eslint-disable-next-line react-hooks/exhaustive-deps
		setTryAndroidApp(/(android)/i.test(navigator.userAgent))
	}, [])

	const allowCollection = () => {
		setState( (prevState) => { return {
			...prevState,
			collectionSnackbar: false,
			collectionSnackbarInfo: true,
		}});
		if(typeof window !== 'undefined')
			window.localStorage.setItem("collectDataConsentValue", "true");
	}

	return (
		<div>
			<CssBaseline />
			<div className={styles.container}>
				<AppBar
					position="static"
					className={styles.header}
					elevation={2}
				>
					{/* <Toolbar className={styles.toolbar}>
						<img
							width={230}
							height={70}
							alt="Charles Translator for Ukraine"
							src={logo.src}
							className={styles.logo}
						/>
						<div className={styles.spacer}></div>
						<AboutUsDialog/>
						<SettingsDialog/>
					</Toolbar> */}
					{/* {notOfficialDeplo && <div className={styles.notOfficialDeplo}>
						<a href="https://lindat.cz/translation">
							🚧🚧This version is not for public, please click here.🚧🚧
						</a>
						<Tooltip title="Close">
							<IconButton
								onClick={()=>setNotOfficialDeplo(false)}
							>
								<CloseIcon />
							</IconButton>
						</Tooltip>
					</div>} */}
				</AppBar>
				{tryAndroidApp && <div className={styles.tryAndroidApp}>
						<a href="https://play.google.com/store/apps/details?id=cz.cuni.mff.ufal.translator">
							<PhoneAndroidIcon/> Try our android app.
						</a>
						<Tooltip title="Close">
							<IconButton
								onClick={()=>setTryAndroidApp(false)}
							>
								<CloseIcon />
							</IconButton>
						</Tooltip>
					</div>}

				{children}

				{/* <Snackbar
					open={state.collectionSnackbar}
					message={`Souhlasím s tím, aby Ústav formální a aplikované lingvistiky
						MFF UK ukládal vstupy a výstupy z překladače. V případě souhlasu
						mohou být anonymizované texty využity pro další vývoj systému.`}
					anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
					action={(
						<React.Fragment>
							<Button size="large" onClick={ allowCollection }>
								<CheckIcon fontSize="small" />
								SOUHLASÍM
							</Button>
							<Button size="large" onClick={() => {
									setState({
										...state,
										collectionSnackbarInfo: true,
										collectionSnackbar: false,
									});
								}}>
								<CloseIcon fontSize="small" />
								NESOUHLASÍM
							</Button>
						</React.Fragment>
					)} */}
				{/* /> */}
				 {/* <Snackbar open={state.collectionSnackbarInfo} autoHideDuration={3000} onClose={() => setState({ ...state, collectionSnackbarInfo: false })}>
					<Alert severity="info" onClose={() => setState({ ...state, collectionSnackbarInfo: false })} sx={{ width: '100%' }}>
						Své rozhodnutí můžete kdykoli později změnit v Nastavení.
					</Alert>
				</Snackbar> */}
{/*
				<div className={styles.footer}>
					THE LINDAT/CLARIAH-CZ PROJECT (LM2018101; formerly
					LM2010013, LM2015071) IS FULLY SUPPORTED BY THE MINISTRY OF
					EDUCATION, SPORTS AND YOUTH OF THE CZECH REPUBLIC UNDER THE
					PROGRAMME LM OF LARGE INFRASTRUCTURES
				</div> */}
			</div>
		</div>
	);
}

export default Layout;
