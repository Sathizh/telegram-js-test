// ============================================================
// NETLIFY TELEGRAM PROFILE BOT
// ============================================================

const NITHRA_API_URL =
    "https://app.nithramatrimony.net/api/getfullview";

const API_TIMEOUT_MS = 15000;
const TELEGRAM_TIMEOUT_MS = 15000;


// ============================================================
// NETLIFY FUNCTION
// ============================================================

exports.handler = async (event) => {

    try {

        console.log("\n======================================");
        console.log("📩 Telegram request received");
        console.log("======================================");


        // ====================================================
        // ONLY ACCEPT POST
        // ====================================================

        if (event.httpMethod !== "POST") {

            return {
                statusCode: 405,

                headers: {
                    "Content-Type": "application/json",
                },

                body: JSON.stringify({
                    ok: false,
                    error: "Method not allowed",
                }),
            };
        }


        // ====================================================
        // VERIFY TELEGRAM WEBHOOK SECRET
        // ====================================================

        const webhookSecret =
            process.env.TELEGRAM_WEBHOOK_SECRET;


        if (webhookSecret) {

            const receivedSecret =
                event.headers?.[
                    "x-telegram-bot-api-secret-token"
                ] ||
                event.headers?.[
                    "X-Telegram-Bot-Api-Secret-Token"
                ];


            if (
                !receivedSecret ||
                receivedSecret !== webhookSecret
            ) {

                console.error(
                    "❌ Invalid Telegram webhook secret"
                );

                return {
                    statusCode: 401,

                    body: JSON.stringify({
                        ok: false,
                        error: "Unauthorized",
                    }),
                };
            }
        }


        // ====================================================
        // PARSE TELEGRAM UPDATE
        // ====================================================

        let update;


        try {

            update =
                JSON.parse(
                    event.body || "{}"
                );

        } catch (error) {

            console.error(
                "❌ Invalid JSON received"
            );

            return {
                statusCode: 400,

                body: JSON.stringify({
                    ok: false,
                    error: "Invalid JSON",
                }),
            };
        }


        const message =
            update.message;


        // ====================================================
        // IGNORE NON-MESSAGE UPDATES
        // ====================================================

        if (!message) {

            console.log(
                "ℹ️ No message in update"
            );

            return {
                statusCode: 200,

                body: JSON.stringify({
                    ok: true,
                }),
            };
        }


        // ====================================================
        // GET CHAT ID
        // ====================================================

        const chatId =
            message.chat?.id;


        if (!chatId) {

            console.error(
                "❌ Telegram chat ID not found"
            );

            return {
                statusCode: 200,

                body: JSON.stringify({
                    ok: true,
                }),
            };
        }


        console.log(
            "Chat ID:",
            chatId
        );


        // ====================================================
        // CHECK ALLOWED USERS
        // ====================================================

        const allowedUsers =
            getAllowedTelegramUsers();


        console.log(
            "Allowed users configured:",
            allowedUsers.length
        );


        if (
            allowedUsers.length === 0
        ) {

            console.error(
                "❌ ALLOWED_TELEGRAM_USERS is not configured"
            );

            await sendTelegramMessage(
                chatId,
                "❌ Bot access is not configured."
            );

            return {
                statusCode: 200,

                body: JSON.stringify({
                    ok: true,
                }),
            };
        }


        if (
            !allowedUsers.includes(
                String(chatId)
            )
        ) {

            console.log(
                `🚫 Unauthorized Telegram user: ${chatId}`
            );

            await sendTelegramMessage(
                chatId,
                "❌ You are not authorized to use this bot."
            );

            return {
                statusCode: 200,

                body: JSON.stringify({
                    ok: true,
                }),
            };
        }


        console.log(
            "✅ Telegram user authorized"
        );


        // ====================================================
        // GET MESSAGE TEXT
        // ====================================================

        const givenId =
            (message.text || "").trim();


        console.log(
            "Message:",
            givenId
        );


        // ====================================================
        // GET TELEGRAM USER NAME
        // ====================================================

        const firstName =
            message.from?.first_name ||
            "there";


        // ====================================================
        // HANDLE /START
        // ====================================================

        if (
            givenId === "/start" ||
            givenId.startsWith("/start ")
        ) {

            const welcomeMessage =
                `👋 <b>வணக்கம் ${escapeHtml(firstName)}!</b>\n\n` +

                `இந்த Bot மூலம் Profile ID-ஐ பயன்படுத்தி Profile விவரங்களை பெறலாம்.\n\n` +

                `📌 <b>எப்படி பயன்படுத்துவது?</b>\n\n` +

                `Profile ID-ஐ மட்டும் அனுப்பவும்.\n\n` +

                `உதாரணம்:\n` +

                `<code>2180279</code>\n\n` +

                `📷 Profile photo மற்றும் Profile விவரங்கள் கிடைக்கும்.\n\n` +

                `🔯 Jathagam image இருந்தால் அதுவும் அனுப்பப்படும்.\n\n` +

                `ℹ️ Profile ID-ஐ அனுப்பி தொடங்குங்கள்.`;


            await sendTelegramMessage(
                chatId,
                welcomeMessage
            );


            console.log(
                "✅ Welcome message sent"
            );


            return {
                statusCode: 200,

                body: JSON.stringify({
                    ok: true,
                }),
            };
        }


        // ====================================================
        // VALIDATE PROFILE ID
        // ====================================================

        if (!givenId) {

            await sendTelegramMessage(
                chatId,
                "தயவுசெய்து Profile ID அனுப்பவும்."
            );

            return {
                statusCode: 200,

                body: JSON.stringify({
                    ok: true,
                }),
            };
        }


        if (
            !/^\d+$/.test(givenId)
        ) {

            await sendTelegramMessage(
                chatId,
                "❌ சரியான Profile ID-ஐ மட்டும் அனுப்பவும்."
            );

            return {
                statusCode: 200,

                body: JSON.stringify({
                    ok: true,
                }),
            };
        }


        // ====================================================
        // GET NITHRA API TOKEN
        // ====================================================

        const bearerToken =
            process.env.API_BEARER_TOKEN;


        if (!bearerToken) {

            console.error(
                "❌ API_BEARER_TOKEN is not configured"
            );

            await sendTelegramMessage(
                chatId,
                "❌ API token is not configured."
            );

            return {
                statusCode: 200,

                body: JSON.stringify({
                    ok: true,
                }),
            };
        }


        // ====================================================
        // CALL NITHRA API
        // ====================================================

        console.log(
            "🔎 Calling Nithra API..."
        );


        let response;


        try {

            response =
                await fetchWithTimeout(

                    `${NITHRA_API_URL}?lib_v_code=17&langID=en&v_code=4&app_via=Mat_iOS_DYNAMIC`,

                    {
                        method: "POST",

                        headers: {
                            "Accept": "*/*",

                            "Authorization":
                                `Bearer ${bearerToken}`,

                            "Content-Type":
                                "application/json; charset=utf-8",
                        },

                        body: JSON.stringify({
                            loadId:
                                Number(givenId),

                            searchMobile:
                                givenId,
                        }),
                    },

                    API_TIMEOUT_MS
                );

        } catch (error) {

            console.error(
                "❌ Nithra API request failed:",
                error.message
            );

            await sendTelegramMessage(
                chatId,
                "❌ Profile API request failed. Please try again."
            );

            return {
                statusCode: 200,

                body: JSON.stringify({
                    ok: true,
                }),
            };
        }


        console.log(
            "Nithra API status:",
            response.status
        );


        // ====================================================
        // CHECK HTTP RESPONSE
        // ====================================================

        if (!response.ok) {

            console.error(
                "❌ Nithra API HTTP error:",
                response.status
            );

            await sendTelegramMessage(
                chatId,
                "❌ Profile API request failed."
            );

            return {
                statusCode: 200,

                body: JSON.stringify({
                    ok: true,
                }),
            };
        }


        // ====================================================
        // PARSE NITHRA RESPONSE
        // ====================================================

        let result;


        try {

            result =
                await response.json();

        } catch (error) {

            console.error(
                "❌ Invalid Nithra API JSON response"
            );

            await sendTelegramMessage(
                chatId,
                "❌ Invalid response from profile API."
            );

            return {
                statusCode: 200,

                body: JSON.stringify({
                    ok: true,
                }),
            };
        }


        // ====================================================
        // CHECK PROFILE
        // ====================================================

        if (
            result.status !== 1 ||
            !result.data
        ) {

            console.log(
                "❌ Profile not found"
            );

            await sendTelegramMessage(
                chatId,
                "❌ Profile கிடைக்கவில்லை."
            );

            return {
                statusCode: 200,

                body: JSON.stringify({
                    ok: true,
                }),
            };
        }


        const profile =
            result.data;


        console.log(
            "Profile name:",
            profile.name
        );


        // ====================================================
        // FORMAT PROFILE CAPTION
        // ====================================================

        const caption =
            formatProfileCaption(
                profile
            );


        // ====================================================
        // GET VERIFIED PROFILE PHOTO
        // ====================================================

        const profilePhotos =
            getImageUrls(
                profile.verified_photo
            );


        // ====================================================
        // SEND PROFILE PHOTO
        // ====================================================

        if (
            profilePhotos.length > 0
        ) {

            const photoResult =
                await sendTelegramPhoto(
                    chatId,
                    profilePhotos[0],
                    caption
                );


            if (
                photoResult?.ok
            ) {

                console.log(
                    "✅ Profile photo sent"
                );

            } else {

                console.error(
                    "❌ Profile photo failed"
                );


                // Send caption as fallback

                const fallbackResult =
                    await sendTelegramMessage(
                        chatId,
                        caption
                    );


                if (
                    fallbackResult?.ok
                ) {

                    console.log(
                        "✅ Profile caption sent as fallback"
                    );

                } else {

                    console.error(
                        "❌ Profile caption fallback failed"
                    );
                }
            }

        } else {

            console.log(
                "⚠️ Verified photo not available"
            );


            const messageResult =
                await sendTelegramMessage(
                    chatId,
                    caption
                );


            if (
                messageResult?.ok
            ) {

                console.log(
                    "✅ Profile caption sent"
                );

            } else {

                console.error(
                    "❌ Profile caption failed"
                );
            }
        }


        // ====================================================
        // GET JATHAGAM IMAGE(S)
        // ====================================================

        const jathagamImages =
            getImageUrls(
                profile.v_jathagam
            );


        // ====================================================
        // SEND JATHAGAM ALBUM
        // ====================================================

        if (
            jathagamImages.length > 0
        ) {

            const albumResult =
                await sendTelegramMediaGroup(
                    chatId,
                    jathagamImages
                );


            if (
                albumResult?.ok
            ) {

                console.log(
                    `✅ Sent ${jathagamImages.length} jathagam image(s)`
                );

            } else {

                console.error(
                    "❌ Jathagam album failed"
                );
            }

        } else {

            console.log(
                "ℹ️ No jathagam image available"
            );
        }


        // ====================================================
        // COMPLETE
        // ====================================================

        console.log(
            "✅ Complete profile response processed"
        );


        return {
            statusCode: 200,

            body: JSON.stringify({
                ok: true,
            }),
        };


    } catch (error) {

        console.error(
            "❌ WEBHOOK ERROR:",
            error
        );


        // Return 200 so Telegram doesn't repeatedly
        // retry the same update.

        return {
            statusCode: 200,

            body: JSON.stringify({
                ok: false,
            }),
        };
    }
};


// ============================================================
// GET ALLOWED TELEGRAM USERS
// ============================================================

function getAllowedTelegramUsers() {

    const value =
        process.env.ALLOWED_TELEGRAM_USERS || "";


    return value
        .split(",")
        .map(id => id.trim())
        .filter(Boolean);
}


// ============================================================
// FORMAT PROFILE CAPTION
// ============================================================

function formatProfileCaption(
    profile
) {

    const name =
        profile.name || "N/A";

    const age =
        profile.age || "N/A";

    const maritalStatus =
        profile.marital_status || "N/A";

    const religion =
        profile.religion_name || "N/A";

    const caste =
        profile.caste || "N/A";

    const motherTongue =
        profile.mother_tongue || "N/A";

    const qualification =
        profile.qualification || "N/A";

    const employedIn =
        profile.employed_in || "N/A";

    const location =
        profile.livingLocationTxt || "N/A";

    const height =
        profile.height || "N/A";

    const weight =
        profile.weight || "N/A";

    const family =
        profile.familyTxt || "N/A";

    const rasi =
        profile.rasi || "N/A";

    const star =
        profile.star || "N/A";

    const havingDosham =
        profile.having_dosham || "N/A";


    // ========================================================
    // MARITAL STATUS
    // ========================================================

    let maritalStatusText =
        maritalStatus;


    if (
        String(maritalStatus)
            .trim()
            .toLowerCase() === "divorced"
    ) {

        maritalStatusText =
            `${maritalStatus} ⚠️`;
    }


    // ========================================================
    // DOSHAM
    // ========================================================

    let doshamText;


    if (
        String(havingDosham)
            .trim()
            .toLowerCase() === "no"
    ) {

        doshamText =
            "இல்லை 🚫";

    } else {

        doshamText =
            "உள்ளது ✅";
    }


    // ========================================================
    // TELEGRAM HTML
    // ========================================================

    return (

        `👤 <b>${escapeHtml(name)}</b>\n\n` +

        `🎂 <b>வயது:</b> ${escapeHtml(age)}\n` +

        `💍 <b>திருமண நிலை:</b> ${escapeHtml(maritalStatusText)}\n` +

        `🛕 <b>மதம்:</b> ${escapeHtml(religion)}\n` +

        `🧬 <b>சாதி:</b> ${escapeHtml(caste)}\n` +

        `🗣 <b>தாய்மொழி:</b> ${escapeHtml(motherTongue)}\n\n` +

        `🎓 <b>கல்வி:</b> ${escapeHtml(qualification)}\n` +

        `💼 <b>வேலை:</b> ${escapeHtml(employedIn)}\n` +

        `📍 <b>இருப்பிடம்:</b> ${escapeHtml(location)}\n\n` +

        `📏 <b>உயரம்:</b> ${escapeHtml(height)}\n` +

        `⚖️ <b>எடை:</b> ${escapeHtml(weight)}\n` +

        `🏠 <b>குடும்பம்:</b> ${escapeHtml(family)}\n\n` +

        `⭐ <b>ராசி:</b> ${escapeHtml(rasi)}\n` +

        `🌟 <b>நட்சத்திரம்:</b> ${escapeHtml(star)}\n` +

        `🔯 <b>தோஷம்:</b> ${escapeHtml(doshamText)}`
    );
}


// ============================================================
// CONVERT IMAGE VALUE TO ARRAY
// ============================================================

function getImageUrls(
    value
) {

    if (!value) {
        return [];
    }


    // API returns array

    if (
        Array.isArray(value)
    ) {

        return value
            .flatMap(item =>
                String(item).split(",")
            )
            .map(url =>
                url.trim()
            )
            .filter(url =>
                url.length > 0
            );
    }


    // API returns comma-separated string

    return String(value)
        .split(",")
        .map(url =>
            url.trim()
        )
        .filter(url =>
            url.length > 0
        );
}


// ============================================================
// SEND TELEGRAM MESSAGE
// ============================================================

async function sendTelegramMessage(
    chatId,
    text
) {

    const botToken =
        process.env.TELEGRAM_BOT_TOKEN;


    if (!botToken) {

        console.error(
            "❌ TELEGRAM_BOT_TOKEN is not configured"
        );

        return null;
    }


    console.log(
        "📤 Sending Telegram message..."
    );


    try {

        const response =
            await fetchWithTimeout(

                `https://api.telegram.org/bot${botToken}/sendMessage`,

                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({

                        chat_id:
                            chatId,

                        text:
                            text,

                        parse_mode:
                            "HTML",

                        disable_web_page_preview:
                            true,

                    }),
                },

                TELEGRAM_TIMEOUT_MS
            );


        const result =
            await response.json();


        console.log(
            "Telegram sendMessage response:",
            JSON.stringify(result)
        );


        return result;


    } catch (error) {

        console.error(
            "❌ Telegram sendMessage error:",
            error.message
        );

        return null;
    }
}


// ============================================================
// SEND PROFILE PHOTO
// ============================================================

async function sendTelegramPhoto(
    chatId,
    photoUrl,
    caption
) {

    const botToken =
        process.env.TELEGRAM_BOT_TOKEN;


    if (!botToken) {

        console.error(
            "❌ TELEGRAM_BOT_TOKEN is not configured"
        );

        return null;
    }


    console.log(
        "📤 Sending profile photo..."
    );


    try {

        const response =
            await fetchWithTimeout(

                `https://api.telegram.org/bot${botToken}/sendPhoto`,

                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({

                        chat_id:
                            chatId,

                        photo:
                            photoUrl,

                        caption:
                            caption,

                        parse_mode:
                            "HTML",

                    }),
                },

                TELEGRAM_TIMEOUT_MS
            );


        const result =
            await response.json();


        console.log(
            "Telegram sendPhoto response:",
            JSON.stringify(result)
        );


        if (
            !result.ok
        ) {

            console.error(
                "❌ Telegram rejected profile photo:",
                result.description
            );
        }


        return result;


    } catch (error) {

        console.error(
            "❌ Telegram sendPhoto error:",
            error.message
        );

        return null;
    }
}


// ============================================================
// SEND JATHAGAM ALBUM
// ============================================================

async function sendTelegramMediaGroup(
    chatId,
    imageUrls
) {

    const botToken =
        process.env.TELEGRAM_BOT_TOKEN;


    if (!botToken) {

        console.error(
            "❌ TELEGRAM_BOT_TOKEN is not configured"
        );

        return null;
    }


    // Telegram allows up to 10 images
    // in a single media group.

    const chunks = [];


    for (
        let i = 0;
        i < imageUrls.length;
        i += 10
    ) {

        chunks.push(
            imageUrls.slice(i, i + 10)
        );
    }


    let lastResult =
        null;


    for (
        const chunk of chunks
    ) {

        const media =
            chunk.map(url => ({

                type:
                    "photo",

                media:
                    url,

            }));


        console.log(
            `📤 Sending jathagam album: ${media.length} image(s)`
        );


        try {

            const response =
                await fetchWithTimeout(

                    `https://api.telegram.org/bot${botToken}/sendMediaGroup`,

                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({

                            chat_id:
                                chatId,

                            media:
                                media,

                        }),
                    },

                    TELEGRAM_TIMEOUT_MS
                );


            const result =
                await response.json();


            console.log(
                "Telegram sendMediaGroup response:",
                JSON.stringify(result)
            );


            if (
                !result.ok
            ) {

                console.error(
                    "❌ Telegram rejected jathagam album:",
                    result.description
                );
            }


            lastResult =
                result;


        } catch (error) {

            console.error(
                "❌ Telegram sendMediaGroup error:",
                error.message
            );
        }
    }


    return lastResult;
}


// ============================================================
// FETCH WITH TIMEOUT
// ============================================================

async function fetchWithTimeout(
    url,
    options = {},
    timeoutMs = 15000
) {

    const controller =
        new AbortController();


    const timeout =
        setTimeout(
            () => controller.abort(),
            timeoutMs
        );


    try {

        return await fetch(
            url,
            {
                ...options,

                signal:
                    controller.signal,
            }
        );

    } finally {

        clearTimeout(
            timeout
        );
    }
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(
    value
) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        );
}
