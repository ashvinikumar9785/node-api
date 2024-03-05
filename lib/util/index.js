const mongoose = require('mongoose'),
    ObjectId = mongoose.Types.ObjectId;
const moment = require('moment');
const fcmNode = require('fcm-node');
const fcm = new fcmNode(process.env.FCM_KEY);
const createObjectId = id => {
    return ObjectId(id);
};
const randomString = (length = 30, charSet = 'ABC5DEfF78G7I5JKL8MNO7PQR8ST5UVnaSdWXYZa5bjcFh6ijk123456789') => {
    let randomString = '';
    for (let i = 0; i < length; i++) {
        let randomPoz = Math.floor(Math.random() * charSet.length);
        randomString += charSet.substring(randomPoz, randomPoz + 1);
    }
    return randomString;
};

const escapeRegex = text => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

// eslint-disable-next-line no-console
const logError = console.error;

const consoleInDevEnv = process.env.NODE_ENV === 'development' && console.log;

/**
 * @param {string} objectId
 * @return {boolean}
 */
const isValidObjectId = objectId => {
    if (mongoose.Types.ObjectId.isValid(objectId)) {
        const id = new mongoose.Types.ObjectId(objectId);
        return id.toString() === objectId;
    }
    return false;
};

const utcDate = (date = new Date()) => {
    date = new Date(date);
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
};

const utcDateTime = (date = new Date()) => {
    date = new Date(date);
    return new Date(
        Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            date.getUTCHours(),
            date.getUTCMinutes(),
            date.getUTCSeconds()
        )
    );
};

const generateResetToken = (length = 4) => {
    return Math.floor(Math.pow(10, length - 1) + Math.random() * (Math.pow(10, length) - Math.pow(10, length - 1) - 1));
};

const showDate = (date, timeZone = globalTimeZone || '', format = 'MMM DD YYYY hh:mm A') => {
    return utcDateTime(date).toString() !== 'Invalid Date'
        ? timeZone
            ? moment(date)
                .tz(timeZone)
                .format(format)
            : moment.utc(date).format(format)
        : 'N/A';
};

const showTime = seconds => new Date(seconds * 1000).toISOString().substr(11, 8);

const fromNow = date => moment(date).fromNow();

const sendFCMPush = (
    tokens,
    title,
    body,
    data = {},
    priority = 'high',
    notificationOptions = {
        click_action: 'FCM_PLUGIN_ACTIVITY',
        icon: 'ic_stat_icon',
        sound: 'default',
        vibrate: true,
    }
) => {
    tokens = !Array.isArray(tokens) ? [tokens] : tokens;
    const fcmMessage = {
        registration_ids: tokens,
        priority,
        notification: {
            title,
            body,
            ...notificationOptions,
        },
        data: {
            PATH: {
                data,
            },
        },
    };
    fcm.send(fcmMessage, err => {
        if (err) logError('FCM ERROR: ', err);
    });
};

const dateTimeStartDay = date => {
    let dateTime = new Date(date);
    return dateTime;
};
const dateTimeEndDay = date => {
    let dateTime = new Date(date);
    dateTime.setDate(dateTime.getDate() + 1);
    return dateTime;
};
const checkModuleAccess = (adminRoleData, moduleName) => {
    //check permission or superadmin
    if (adminRoleData && (adminRoleData.allowedModules.includes(moduleName) || adminRoleData.isSuperAdmin)) {
        return true;
    }
    return false;
};
const checkOneArrayConflitWithAnthor = (array1, array2) => {
    let conflict_count = false;
    for (let i of array1) {
        if (array2.includes(i)) {
            conflict_count = true;
        }
    }
    return conflict_count;
};

const timeZoneOffsetToMin = offset => {
    let [h, m] = offset.split(':');
    let hours = Number.parseInt(h);
    let minutes = Number.parseInt(m);
    let totalMinutes = hours * 60 + (hours < 0 ? -minutes : minutes);
    return totalMinutes;
};

const formattedDate = timestamp => {
    let date = new Date(timestamp);
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    return [year, month > 9 ? month : `0${month}`, day > 9 ? day : `0${day}`].join('-');
};

const getFileType = fileName => {
    let fileExtention = fileName
        .split('.')
        .pop()
        .toLowerCase();
    let fileType = '';
    if (['pdf'].includes(fileExtention)) {
        fileType = 'PDF';
    } else if (['doc'].includes(fileExtention)) {
        fileType = 'DOC';
    } else if (['xls'].includes(fileExtention)) {
        fileType = 'XLS';
    }
    return fileType;
};



const generateUsername = name => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?';
    let username = `@${name.toLowerCase().replace(/\s+/g, '_')}`;
    for (let i = 0; i < 8; i++) { // Generate a 8-character random string after the name
        const randomIndex = Math.floor(Math.random() * characters.length);
        username += characters[randomIndex];
    }
    return username;
}



module.exports = {
    createObjectId,
    escapeRegex,
    logError,
    consoleInDevEnv,
    isValidObjectId,
    utcDate,
    utcDateTime,
    randomString,
    generateResetToken,
    showDate,
    showTime,
    fromNow,
    sendFCMPush,
    dateTimeStartDay,
    dateTimeEndDay,
    checkModuleAccess,
    checkOneArrayConflitWithAnthor,
    timeZoneOffsetToMin,
    formattedDate,
    getFileType,
    generateUsername
};
