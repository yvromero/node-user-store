import { JwtAdapter, bcryptAdapter, envs } from "../../config";
import { UserModel } from "../../data";
import { CustomError, LoginUserDto, RegisterUserDto, UserEntity } from "../../domain";
import { EmailService } from "./email.service";



export class AuthService {

    // Inyectar el servicio
    constructor(
        private readonly emailService: EmailService,
    ) {}


    public async registerUser( registerUserDto: RegisterUserDto ) {

        const existstUser = await UserModel.findOne({ email: registerUserDto.email });
        if ( existstUser ) throw CustomError.badRequest('Account already exists');

        try {
            const user = new UserModel(registerUserDto);


            // Encriptar el password
            user.password = bcryptAdapter.hash( registerUserDto.password );
            await user.save();

            // JWT <=== mantener la autenticacion del user

            // Email de confirmacion
            await this.sendEmailValidationLink( user.email );

            // Usar el servicio: emailservice

            const { password, ...userData } = UserEntity.fromObject(user);

            const token = await JwtAdapter.generateToken({ id: user.id });
            if ( !token ) throw CustomError.internalServer('Error while creating JWT');

            return {
                user: userData,
                token: token,
            };

        } catch (error) {
            throw CustomError.internalServer(`${ error }`);
        }
    }

    public async loginUser( loginUserDto: LoginUserDto ) {

        const user = await UserModel.findOne({ email: loginUserDto.email});
        
        if ( !user ) throw CustomError.badRequest('Account no exists');

        const isMatching = bcryptAdapter.compare( loginUserDto.password, user.password );
        if ( !isMatching ) throw CustomError.badRequest('Account no exists');
        
        const { password, ...userData } = UserEntity.fromObject(user);

        const token = await JwtAdapter.generateToken({ id: user.id  });
        if ( !token ) throw CustomError.internalServer('Error while creating JWT');

        return {
            user: userData,
            token: token,
        };
    }

    // Create a additional method
    private sendEmailValidationLink = async( email: string ) => {

        const token = await JwtAdapter.generateToken({ email });
        if ( !token ) throw CustomError.internalServer('Error getting token');

    // Create return link
        const link = `${ envs.WEBSERVICE_URL }/auth/validate-email/${ token }`;
        const html = `
        <h1>Validate your email</h1>
        <p>Click on the following link to validate your email</p>
        <a href="${ link }">Validate your email: ${ email} </a>
        `;

        const options = {
            to: email,
            subject: 'Validate your email',
            htmlBody: html,
        }

        const isSent = await this.emailService.sendEmail(options);
        if ( !isSent ) throw CustomError.internalServer('Error sending email');

        return true;
    }

    public validateEmail = async(token:string) => {

        const payload = await JwtAdapter.validateToken( token );
        if ( !payload ) throw CustomError.unauthorized('Invalid token');

        const { email } = payload as { email: string };
        if ( !email ) throw CustomError.internalServer( 'Email not in token');

        const user = await UserModel.findOne({ email });
        if ( !user ) throw CustomError.internalServer('Email not exists');

        user.emailValidated = true;
        await user.save();

        return true;
    }

}