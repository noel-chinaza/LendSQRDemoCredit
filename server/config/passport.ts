import { PrismaClient, User, UserTier } from "@prisma/client";
import passport from "passport";
import { ExtractJwt, Strategy as JWTStrategy } from "passport-jwt";
const prisma = new PrismaClient();

passport.use(
	"jwt",
	new JWTStrategy(
		{
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: process.env["SESSION_SECRET"],
		},
		function (payload, done) {
			console.error(payload);

			prisma.user
				.findFirst({
					where: {
						id: (payload as User).id,
                        userTier: UserTier.CIVILIAN
					},
				})
				.then((user: any) => {
					if (!user) {
						return done("account not found", false);
					}

					delete user.hash;
					delete user.salt;

					return done(null, user);
				})
				.catch((err) => {
					console.error(err);
					return done("unknown error occured");
				});
		}
	)
);

passport.serializeUser(function (user: any|User, done) {
	delete user.hash;
	delete user.salt;
	done(null, user);
});

passport.deserializeUser(function (user: User, done) {
	prisma.user
		.findFirst({
			where: { id: user.id },
		})
		.then((user: any) => {
			delete user.hash;
			delete user.salt;
			done(null, user);
		})
		.catch((err) => {
			console.error(err);
			done(err, null);
		});
});
