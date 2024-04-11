import { JwtAdapter, bcryptAdapter } from "../../config";
import { UserModel } from "../../data";
import { CustomError, LoginUserDto, RegisterUserDto, UserEntity } from "../../domain";



export class AuthService {

    // DI
    constructor() {}

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
}