import React, { useState, useRef } from "react";
import debounce from "debounce-promise";
import { Button, IconButton, InputAdornment, LinearProgress, TextField, Tooltip, Paper } from "@mui/material";
import {
    Clear as ClearIcon,
    ContentCopy as ContentCopyIcon,
    ErrorOutline as ErrorOutlineIcon,
    SwapVert,
} from "@mui/icons-material";

import { getHistory, saveHistory } from "../history";
import { translate } from "../api";
import ASR from "./asr";
import { TranslationHistory } from "./TranslationHistory";
import { transliterateCyrilToLatin, transliterateLatinToCyril } from "../transliterate";

import ukraineFlag from "../../public/static/img/ukraine.png";
import czechFlag from "../../public/static/img/czech-republic.png";

import styles from "./form.module.scss";

const debouncedTranslate = debounce(translate, 500);
const debouncedSave = debounce(saveHistory, 3000);

const languageUk = {
    id: "uk",
    name: "Українською",
    transliterate: transliterateCyrilToLatin,
    flag: ukraineFlag,
};

const languageCs = {
    id: "cs",
    name: "Česky",
    transliterate: transliterateLatinToCyril,
    flag: czechFlag,
};

let loadingID = 0; // id of most recent sent request
let loadedID = 0; // id o most recent received request

const Form = () => {
    const [state, setState] = useState({
        source: "",
        asrTempOutput: "",
        translation: "",
        sourceLanguage: languageCs,
        targetLanguage: languageUk,
        loading: false,
        loadingError: null,
    });
    const [loading, setLoading] = useState(false);
    const [loadingError, setLoadingError] = useState(null);

    let inputTypeStatistics = "keyboard";

    React.useEffect(() => {
        const defaultSource = localStorage.getItem("lastTranslationSource");

        if (defaultSource === null) return;

        if (defaultSource === languageCs.id)
            setState((prevState) => {
                return { ...prevState, sourceLanguage: languageCs, targetLanguage: languageUk };
            });
        else
            setState((prevState) => {
                return { ...prevState, sourceLanguage: languageUk, targetLanguage: languageCs };
            });
    }, []);

    const focusInput = useRef(null);

    React.useEffect(() => {
        if (focusInput.current) focusInput.current.focus();
    }, [focusInput]);

    function handleChangeSource(
        text,
        additive = false,
        format_to_sentences = false,
        fromLanguage = state.sourceLanguage.id,
        toLanguage = state.targetLanguage.id
    ) {
        setState((prevState) => {
            if (additive) {
                if (format_to_sentences) {
                    if (text.length > 0) text = text.charAt(0).toLocaleUpperCase() + text.slice(1);
                    if (text !== "") text += ".";
                    if (text !== "" && prevState.source !== "") text = "\n" + text;
                } else {
                    text = text.trim();
                    text = text.replace(/([.!?])/g, "$1\n");
                    const stable = prevState.source;
                    if (stable.length !== 0 && !stable.endsWith(" ") && !stable.endsWith("\n")) text = " " + text;
                    text = stable + text;
                }
            }

            return { ...prevState, source: text };
        });

        setLoading(true);

        if (typeof window !== "undefined") window.localStorage.setItem("lastTranslationSource", fromLanguage);

        debouncedSave(fromLanguage, toLanguage, text);
        debouncedTranslate({
            text,
            fromLanguage,
            toLanguage,
            loadingID: ++loadingID,
            inputType: inputTypeStatistics,
        })
            .then((data) => {
                // this request is last that was sent
                if (data.loadingID === loadingID) setLoading(false);

                // this request has some new information
                if (loadedID < data.loadingID) {
                    loadedID = data.loadingID;
                    setState((prevState) => {
                        return { ...prevState, translation: data.data.trim() };
                    });
                    setLoadingError(null);
                }
            })
            .catch((error) => {
                setLoading(false);
                setLoadingError(error.data || "");
                console.error("Error when loading translation");
                console.error(error);
            });
    }

    const flipLanguages = () => {
        const oldSource = state.sourceLanguage.id == languageCs.id ? languageCs : languageUk;
        const oldTarget = state.targetLanguage.id == languageCs.id ? languageCs : languageUk;
        const oldTranslation = state.translation;
        setState((prevState) => {
            return {
                ...prevState,
                source: oldTranslation,
                translation: "",
                sourceLanguage: oldTarget,
                targetLanguage: oldSource,
            };
        });
        inputTypeStatistics = "swap-languages";
    };

    React.useEffect(() => {
        handleChangeSource(state.source, false, false);
    }, [state.sourceLanguage.id]);

    function sleep(ms) {
        var start = new Date().getTime(),
            expire = start + ms;
        while (new Date().getTime() < expire) {}
        return;
    }

    function translate(text) {
        var res = "";
        if (text == "") return res;

        async function postData(url, data) {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    Host: "api-free.deepl.com",
                    Authorization: "DeepL-Auth-Key c2406305-adaa-8a03-7b08-26da61fe27f8:fx",
                    "User-Agent": "YourApp/1.2.3",
                    "Content-Length": "37",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: data,
            });
            return response.json();
        }

        postData(
            "https://api-free.deepl.com/v2/translate",
            "text=" + encodeURIComponent(text) + "&target_lang=EN"
        ).then(function (data) {
            updateEnTranslation(enTranslation + data.translations[0].text);
        });
    }

    const [previousSource, setPreviousSource] = useState("");
    const [enTranslation, updateEnTranslation] = useState("");
    function handleTranslation() {
        if (previousSource != state.source) {
            translate(state.source.substring(previousSource.length, state.source.length));
            setPreviousSource(state.source);
        }
        return enTranslation;
    }

    return (
        <div className={styles.flex}>
            <Paper elevation={2} className={styles.translationFieldContainer}>
                <div className={styles.translationHeaderContainer}>
                    <div className={styles.languageContainer}>
                        {/* <img
                            width={30}
                            height={30}
                            alt="flag"
                            src={state.sourceLanguage.flag.src}
                            className={styles.flagIcon}
                        /> */}
                        <label className={styles.label} htmlFor="destination">
                            {/* {state.sourceLanguage.name} */}
                            English
                        </label>
                    </div>
                    <div className={styles.asrTempOutput}>{state.asrTempOutput}</div>
                    <div className={styles.asrContainer}>
                        <ASR
                            onresult={(data) => {
                                setState((prevState) => {
                                    return { ...prevState, asrTempOutput: data };
                                });
                            }}
                            onfinal={(data) => {
                                inputTypeStatistics = "voice";
                                handleChangeSource(data, true);
                            }}
                            onerror={(data) => {
                                console.error("from form onerror ASR:", data);
                            }} // todo remove or show to user
                            language={state.sourceLanguage.id}
                        />
                    </div>
                </div>
                <TextField
                    value={handleTranslation()}
                    label=" "
                    onChange={(e) => {
                        switch (e.nativeEvent.inputType) {
                            case "insertFromPaste":
                                inputTypeStatistics = "clipboard";
                                break;
                            case "deleteContentBackward":
                            case "insertText":
                            default:
                                inputTypeStatistics = "keyboard";
                        }
                        return handleChangeSource(e.target.value);
                    }}
                    id="source"
                    variant="filled"
                    color={state.source.length > 2000 ? "warning" : "primary"}
                    error={state.source.length > 5000}
                    helperText={state.source.length > 2000 ? "maximum text size is 5000 chars" : ""}
                    multiline
                    inputRef={focusInput}
                    minRows={6}
                    className={styles.sourceInput}
                    // InputProps={{
                    //     endAdornment: (
                    //         <InputAdornment position="end">
                    //             {state.source.length !== 0 && (
                    //                 <Tooltip className={styles.removeButton} title="Clear source text">
                    //                     <IconButton
                    //                         onClick={() => {
                    //                             handleChangeSource("");
                    //                             focusInput.current.focus();
                    //                         }}
                    //                     >
                    //                         <ClearIcon />
                    //                     </IconButton>
                    //                 </Tooltip>
                    //             )}
                    //         </InputAdornment>
                    //     ),
                    // }}
                />
            </Paper>
{/*
            <div className={styles.switchButtonWrapper}>
                <Tooltip title="Swap languages">
                    <IconButton
                        aria-label="switch languages"
                        onClick={() => {
                            flipLanguages();
                            focusInput.current.focus();
                        }}
                        size="large"
                    >
                        <SwapVert fontSize="large" color="primary" />
                    </IconButton>
                </Tooltip>
            </div> */}

            {/* <Paper elevation={2} className={styles.translationFieldContainer}>
                <div className={styles.translationHeader}>
                    <div className={styles.languageContainer}>
                        <img
                            width={30}
                            height={30}
                            alt="flag"
                            src={state.targetLanguage.flag.src}
                            className={styles.flagIcon}
                        />
                        <label className={styles.label} htmlFor="destination">
                            {state.targetLanguage.name}
                        </label>
                    </div>

                    {state.translation.length !== 0 && navigator.clipboard !== undefined && (
                        <Tooltip title="Copy translation to cliboard">
                            <Button
                                onClick={() => {
                                    navigator.clipboard.writeText(state.translation);
                                }}
                                variant="text"
                                size="small"
                                startIcon={<ContentCopyIcon />}
                            >
                                COPY
                            </Button>
                        </Tooltip>
                    )}
                    <TranslationHistory
                        getHistory={() => getHistory()}
                        onSelect={(...args) => {
                            inputTypeStatistics = "history";
                            return handleChangeSource(...args);
                        }}
                    />
                </div>
                {loading && <LinearProgress className={styles.loadingBar} />}
                <div className={styles.translationOutput}>
                    {loadingError !== null ? (
                        <div className={styles.networkError}>
                            <ErrorOutlineIcon />
                            <span>{loadingError !== "" ? loadingError : "Translation error"}</span>
                            <Button
                                onClick={() => {
                                    handleChangeSource(state.source);
                                }}
                            >
                                Try again
                            </Button>
                        </div>
                    ) : (
                        <div>
                            <div className={styles.translationText}>
                                {state.translation.split("\n").map((item, i) => (
                                    <p key={i} style={{ margin: 0 }}>
                                        {item !== "" ? item : <br />}
                                    </p>
                                ))}
                            </div>

                            <div className={styles.transliteration}>
                                {state.targetLanguage
                                    .transliterate(state.translation)
                                    .split("\n")
                                    .map((item, i) => (
                                        <p key={i} style={{ margin: 0 }}>
                                            {item !== "" ? item : <br />}
                                        </p>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            </Paper> */}
        </div>
    );
};

export default Form;
