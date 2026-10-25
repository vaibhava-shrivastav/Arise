import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import Hunter from '../models/Hunter.js';

export default function configurePassport(passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BASE_URL}/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let hunter = await Hunter.findOne({ googleId: profile.id });
          if (!hunter) {
            hunter = await Hunter.create({
              googleId: profile.id,
              name: profile.displayName || '',
              email: profile.emails?.[0]?.value || '',
              avatar: profile.photos?.[0]?.value || '',
            });
          }
          return done(null, hunter);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  passport.serializeUser((hunter, done) => {
    done(null, hunter.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const hunter = await Hunter.findById(id);
      done(null, hunter);
    } catch (error) {
      done(error, null);
    }
  });
}