import { takeLatest, all, call, put } from 'redux-saga/effects';

import userActionTypes from "./user.types";

import { auth, googleProvider, createUserProfileDocument, getCurrentUser } from "../../firebase/firebase.util";

import { signInSuccess, signInError, signOutSuccess, signOutError, signUpError, emailSignInStart } from "./user.actions";

export function* getSnapshotFromUserAuth(userAuth) {
    try {
        const userRef = yield call(createUserProfileDocument, userAuth);
        const userSnapshot = yield userRef.get();
        yield put(signInSuccess({id: userSnapshot.id, ...userSnapshot.data}));
    } catch (error) {
        yield put(signInError(error));
    }
}

export function* signInWithGoogle() {
    try {
        const { user } = yield auth.signInWithPopup(googleProvider);
        yield getSnapshotFromUserAuth(user);

    } catch (error) {
        yield put(signInError(error));
    }
}

export function* signInWithEmail({payload: { email, password }}) {
    try {
        const { user } = yield auth.signInWithEmailAndPassword(email, password);
        yield getSnapshotFromUserAuth(user);
    } catch (error) {
        yield put(signInError(error));
    }
}

export function* isUserAuthenticated() {
    try {
        const userAuth = yield getCurrentUser();
        if (!userAuth) return;
        yield getSnapshotFromUserAuth(userAuth);
    } catch (error) {
        yield put(signInError(error));
    }
}

export function* signOut() {
    try {
        yield auth.signOut();
        yield put(signOutSuccess());
    } catch (error) {
        yield put(signOutError(error));
    }
}

export function* signUp({payload: { email, password, displayName }}) {

    try {
        const { user } = yield auth.createUserWithEmailAndPassword(email, password);
        yield createUserProfileDocument(user, { displayName });

        const emailAndPassword = {email, password};
        yield put(emailSignInStart(emailAndPassword));
    } catch (error) {
       yield put(signUpError(error));
    }
}

export function* onGoogleSignInStart() {
    yield takeLatest(
        userActionTypes.GOOGLE_SIGN_IN_START,
        signInWithGoogle
        );
}

export function* onEmailSignInStart() {
    yield takeLatest(
        userActionTypes.EMAIL_SIGN_IN_START,
        signInWithEmail
    );
}

export function* onCheckUserSession() {
    yield takeLatest(
        userActionTypes.CHECK_USER_SESSION,
        isUserAuthenticated
    )
}

export function* onSignOutStart() {
    yield takeLatest(
        userActionTypes.SIGN_OUT_START,
        signOut
    )
}

export function* onSignUp() {
    yield takeLatest(
        userActionTypes.SIGN_UP_START,
        signUp,
    )
}

export function* userSagas() {
    yield all([
        call(onGoogleSignInStart),
        call(onEmailSignInStart),
        call(onCheckUserSession),
        call(onSignOutStart),
        call(onSignUp)
    ]);
}