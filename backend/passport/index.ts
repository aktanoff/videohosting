import passport from "passport";
import User from "../database/models/user";
import PassportGoogleOauth from "passport-google-oauth";
import dotenv from "dotenv";

dotenv.config();

const GoogleStrategy = PassportGoogleOauth.OAuth2Strategy;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/user/oauth/google/callback",
    },
    async function (accessToken, refreshToken, profile, done) {
      const email = profile?.emails?.[0]?.value;
      const avatar = profile?.photos?.[0]?.value;
      const firstName = profile?.name?.givenName;
      const secondName = profile?.name?.familyName;

      if (!email) {
        return done(null, false, { message: "Google Auth Error" });
      }

      const user = await User.findOne({ where: { email } }).then(
        async (user) => {
          let newUser = user;

          if (!newUser) {
            newUser = await User.create({
              avatar,
              email,
              firstName,
              secondName,
            });
          }

          newUser.avatar = avatar;
          newUser.firstName = firstName;
          newUser.secondName = secondName;
          return await newUser.save();
        }
      );

      done(null, user);
    }
  )
);

passport.serializeUser(function (user: User, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findOne({ where: { id } }).then((user) => {
    if (!user) {
      return done(null, false);
    }

    done(null, user);
  });
});

export default passport;
