import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { UserService } from "./users.service";
import { AuthService } from "../auth/auth.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RegisterUserDto } from "./dto/register-user.dto";
import { RegisterTheaterOwnerDto } from "./dto/register-theater-owner.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";
import { LoginDto } from "./dto/login.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

@ApiTags('auth')
@Controller("auth")
export class UserController {
    constructor(
        private readonly userService : UserService,
        private readonly authService : AuthService
    ) {}

    @Post('register')
    @ApiOperation({ summary: 'Register a new user (customer)' })
    @ApiResponse({ status: 201, description: 'User registered successfully' })
    @ApiResponse({ status: 400, description: 'Bad request - user already exists' })
    register(@Body() registerUserDto: RegisterUserDto)
    {
        return this.userService.registerUser(registerUserDto);
    }

    @Post('register-theater-owner')
    @ApiOperation({ summary: 'Register a new theater owner' })
    @ApiResponse({ status: 201, description: 'Theater owner registered successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    registerTheaterOwner(@Body() registerTheaterOwnerDto: RegisterTheaterOwnerDto)
    {
        return this.userService.registerTheaterOwner(registerTheaterOwnerDto);
    }

    @Post('verify-otp')
    @ApiOperation({ summary: 'Verify OTP for email' })
    @ApiResponse({ status: 200, description: 'OTP verified successfully' })
    @ApiResponse({ status: 404, description: 'User not found' })
    @ApiResponse({ status: 400, description: 'Invalid OTP' })
    verifyOTP(@Body() verifyOtpDto: VerifyOtpDto)
    {
        return this.userService.verifyOtp(verifyOtpDto.email, verifyOtpDto.otp)
    }

    @Post('login')
    @ApiOperation({ summary: 'User login' })
    @ApiResponse({ status: 200, description: 'Login successful' })
    @ApiResponse({ status: 404, description: 'User not found' })
    @ApiResponse({ status: 400, description: 'Invalid credentials or user not verified' })
    login(@Body() loginDto: LoginDto)
    {
        return this.authService.login(loginDto.email, loginDto.password);
    }

    @Get('user/:id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get user by ID' })
    @ApiResponse({ status: 200, description: 'User retrieved successfully' })
    @ApiResponse({ status: 404, description: 'User not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    getUserById(@Param('id') id: string)
    {
        return this.userService.getUserById(id);
    }

    @Post('forgot-password')
    @ApiOperation({ summary: 'Request password reset OTP' })
    @ApiResponse({ status: 200, description: 'OTP sent successfully' })
    @ApiResponse({ status: 404, description: 'User not found' })
    forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto)
    {
        return this.userService.forgotPassword(forgotPasswordDto.email);
    }

    @Post('reset-password')
    @ApiOperation({ summary: 'Reset password with OTP' })
    @ApiResponse({ status: 200, description: 'Password reset successfully' })
    @ApiResponse({ status: 404, description: 'User not found' })
    @ApiResponse({ status: 400, description: 'Invalid OTP or passwords do not match' })
    resetPassword(@Body() resetPasswordDto: ResetPasswordDto)
    {
        return this.userService.resetPassword(
            resetPasswordDto.email,
            resetPasswordDto.otp,
            resetPasswordDto.newPassword,
            resetPasswordDto.confirmPassword
        )
    }
}
