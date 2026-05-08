import { Body, Controller, Get, Param, Post, UseGuards, Query, BadRequestException } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { UserService } from "./users.service";
import { AuthService } from "../auth/auth.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RegisterUserDto } from "./dto/register-user.dto";
import { RegisterTheaterOwnerDto } from "./dto/register-theater-owner.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";
import { LoginDto } from "./dto/login.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { UserFilterDto } from "./dto/user-filter.dto";
import { BypassThrottle } from "../../common/throttler/throttler.decorator";
import { RequirePermissions } from "../permission/decorators/permissions.decorator";
import { PermissionsGuard } from "../permission/guards/permission.guard";
import * as messageConfig from "../../common/config/message.json";

@ApiTags('auth')
@Controller("auth")
export class UserController {
    constructor(
        private readonly userService : UserService,
        private readonly authService : AuthService
    ) {}

    @Post('register')
    @BypassThrottle()
    @ApiOperation({ summary: 'Register a new user (customer)' })
    @ApiResponse({ status: 201, description: 'User registered successfully' })
    @ApiResponse({ status: 400, description: 'Bad request - user already exists' })
    async register(@Body() registerUserDto: RegisterUserDto)
    {
        return {
            message: messageConfig.messages.AUTH.USER_REGISTER,
            data: await this.userService.registerUser(registerUserDto)
        };
    }

    @Post('register-theater-owner')
    @BypassThrottle()
    @ApiOperation({ summary: 'Register a new theater owner' })
    @ApiResponse({ status: 201, description: 'Theater owner registered successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async registerTheaterOwner(@Body() registerTheaterOwnerDto: RegisterTheaterOwnerDto)
    {
        return {
            message: messageConfig.messages.AUTH.THEATER_OWNER_REGISTER,
            data: await this.userService.registerTheaterOwner(registerTheaterOwnerDto)
        };
    }

    @Post('verify-otp')
    @BypassThrottle()
    @ApiOperation({ summary: 'Verify OTP for email' })
    @ApiResponse({ status: 200, description: 'OTP verified successfully' })
    @ApiResponse({ status: 404, description: 'User not found' })
    @ApiResponse({ status: 400, description: 'Invalid OTP' })
    async verifyOTP(@Body() verifyOtpDto: VerifyOtpDto)
    {
        return {
            message: messageConfig.messages.AUTH.OTP_VERIFY,
            data: await this.userService.verifyOtp(verifyOtpDto.email, verifyOtpDto.otp)
        };
    }

    @Post('login')
    @ApiOperation({ summary: 'User login' })
    @ApiResponse({ status: 200, description: 'Login successful' })
    @ApiResponse({ status: 404, description: 'User not found' })
    @ApiResponse({ status: 400, description: 'Invalid credentials or user not verified' })
    async login(@Body() loginDto: LoginDto)
    {
        return {
            message: messageConfig.messages.AUTH.LOGIN,
            data: await this.authService.login(loginDto.email, loginDto.password)
        };
    }

    @Get('users')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions('MANAGE_USERS')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all users with filters' })
    @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'roleId', required: false })
    @ApiQuery({ name: 'roleName', required: false })
    @ApiQuery({ name: 'isVerified', required: false })
    @ApiQuery({ name: 'isActive', required: false })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    @ApiQuery({ name: 'roleNames', required: false })
    async findAllUsers(@Query() filters: UserFilterDto)
    {
        return {
            message: 'Users retrieved successfully',
            data: await this.userService.findAllUsers(filters)
        };
    }

    @Get('user/:id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions('READ_USER')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get user by ID' })
    @ApiResponse({ status: 200, description: 'User retrieved successfully' })
    @ApiResponse({ status: 404, description: 'User not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getUserById(@Param('id') id: string)
    {
        return {
            message: messageConfig.messages.AUTH.GET_USER,
            data: await this.userService.getUserById(id)
        };
    }

    @Post('forgot-password')
    @BypassThrottle()
    @ApiOperation({ summary: 'Request password reset OTP' })
    @ApiResponse({ status: 200, description: 'OTP sent successfully' })
    @ApiResponse({ status: 404, description: 'User not found' })
    @ApiResponse({ status: 400, description: 'Either email or mobile number is required' })
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto)
    {
        const emailOrMobile = forgotPasswordDto.email || forgotPasswordDto.mobileNumber;
        
        if (!emailOrMobile) {
            throw new BadRequestException('Either email or mobile number is required');
        }

        const result = await this.userService.forgotPassword(emailOrMobile);
        
        return {
            message: messageConfig.messages.AUTH.FORGOT_PASSWORD,
            data: result
        };
    }

    @Post('reset-password')
    @BypassThrottle()
    @ApiOperation({ summary: 'Reset password with OTP' })
    @ApiResponse({ status: 200, description: 'Password reset successfully' })
    @ApiResponse({ status: 404, description: 'User not found' })
    @ApiResponse({ status: 400, description: 'Invalid OTP or passwords do not match' })
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto)
    {
        return {
            message: messageConfig.messages.AUTH.RESET_PASSWORD,
            data: await this.userService.resetPassword(
                resetPasswordDto.email,
                resetPasswordDto.otp,
                resetPasswordDto.newPassword,
                resetPasswordDto.confirmPassword
            )
        };
    }
}
