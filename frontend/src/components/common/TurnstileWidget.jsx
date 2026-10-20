import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef
} from "react";


const TurnstileWidget = forwardRef(function TurnstileWidget(
    {
        onVerify,
        onExpire,
        onError
    },
    ref
) {

    const contenedorRef = useRef(null);
    const widgetIdRef = useRef(null);

    const onVerifyRef = useRef(onVerify);
    const onExpireRef = useRef(onExpire);
    const onErrorRef = useRef(onError);


    const siteKey =
        import.meta.env.VITE_TURNSTILE_SITE_KEY;


    useEffect(() => {

        onVerifyRef.current = onVerify;
        onExpireRef.current = onExpire;
        onErrorRef.current = onError;

    }, [
        onVerify,
        onExpire,
        onError
    ]);


    useImperativeHandle(
        ref,
        () => ({
            reset() {

                if (
                    window.turnstile &&
                    widgetIdRef.current !== null
                ) {

                    window.turnstile.reset(
                        widgetIdRef.current
                    );

                    onVerifyRef.current?.("");

                }

            }
        }),
        []
    );


    useEffect(() => {

        if (!siteKey) {

            console.error(
                "VITE_TURNSTILE_SITE_KEY no está configurada."
            );

            return;

        }


        let script =
            document.querySelector(
                'script[src*="challenges.cloudflare.com/turnstile"]'
            );


        const renderizarWidget = () => {

            if (
                !contenedorRef.current ||
                !window.turnstile ||
                widgetIdRef.current !== null
            ) {
                return;
            }


            widgetIdRef.current =
                window.turnstile.render(
                    contenedorRef.current,
                    {
                        sitekey: siteKey,

                        theme: "auto",

                        size: "flexible",

                        callback: (token) => {

                            onVerifyRef.current?.(
                                token
                            );

                        },

                        "expired-callback": () => {

                            onVerifyRef.current?.("");

                            onExpireRef.current?.();

                        },

                        "error-callback": (codigo) => {

                            onVerifyRef.current?.("");

                            onErrorRef.current?.(
                                codigo
                            );

                        }
                    }
                );

        };


        if (window.turnstile) {

            renderizarWidget();

        } else {

            if (!script) {

                script =
                    document.createElement(
                        "script"
                    );


                script.src =
                    "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";


                script.async = true;
                script.defer = true;


                document.head.appendChild(
                    script
                );

            }


            script.addEventListener(
                "load",
                renderizarWidget
            );

        }


        return () => {

            if (script) {

                script.removeEventListener(
                    "load",
                    renderizarWidget
                );

            }


            if (
                window.turnstile &&
                widgetIdRef.current !== null
            ) {

                try {

                    window.turnstile.remove(
                        widgetIdRef.current
                    );

                } catch (error) {

                    console.error(
                        "Error eliminando Turnstile:",
                        error
                    );

                }

            }


            widgetIdRef.current = null;

        };

    }, [siteKey]);


    return (

        <div
            ref={contenedorRef}
            className="turnstile-contenedor"
        />

    );

});


export default TurnstileWidget;