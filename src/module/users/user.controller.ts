import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { UserService } from "./users.service";
import { AuthService } from "../auth/auth.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RegisterUserDto } from "./dto/register-user.dto";
import { RegisterTheaterOwnerDto } from "./dto/register-theater-owner.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";
import { LoginDto } from "./dto/login.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { BypassThrottle } from "../../common/throttler/throttler.decorator";
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

    @Get('user/:id')
    @UseGuards(JwtAuthGuard)
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
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto)
    {
        return {
            message: messageConfig.messages.AUTH.FORGOT_PASSWORD,
            data: await this.userService.forgotPassword(forgotPasswordDto.email)
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
