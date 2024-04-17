import { Validators } from "../../../config";


export class CreateProductDto {

    private constructor(
        public readonly name: string,
        public readonly available: boolean,
        public readonly price: number,
        public readonly description: number,
        public readonly user: string, // ID
        public readonly category: string, // ID
    ) {}

    static create( props: { [key: string]: any }): [string?, CreateProductDto?] {

        const {
            name,
            available,
            price,
            description,
            user,
            category,
        } = props;

        if ( !name ) return ['Missing name'];
        if ( !user ) return ['Missing user'];
        if ( !Validators.isMongoID(user) ) 
            return ['Invalid User ID'];
        if ( !category ) return ['Missing category'];
        if ( !Validators.isMongoID(category) ) 
            return ['Invalid Category ID'];

        return [
            undefined,
            new CreateProductDto(
                name,
                !!available,
                price,
                description,
                user,
                category,
            )
        ]
    }

}