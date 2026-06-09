import time
import random
from django.core.cache import cache


class OTPService:
    """
    Unified Stateful OTP Engine.
    Handles temporary caching namespaces with transient Redis structure,
    rate-limiting, and brute-force self-destruction flushes.
    """

    @staticmethod
    def get_otp_key(portal_name, email):
        return f"otp:{portal_name}:{email}"

    @staticmethod
    def get_lock_key(portal_name, email):
        return f"lock:{portal_name}:{email}"

    @staticmethod
    def get_verified_key(portal_name, email):
        return f"verified:{portal_name}:{email}"

    @classmethod
    def send_otp(cls, portal_name, email, otp_code=None):
        """
        Sends/sets a new OTP for the email.
        Enforces a 60-second rate-limiting constraint check.
        """
        lock_key = cls.get_lock_key(portal_name, email)
        if cache.get(lock_key):
            # Lock exists -> Rate limited (429)
            return {
                "status": "rate_limited",
                "message": "Please wait 60 seconds before requesting another OTP.",
            }

        # Generate a random 6-digit OTP code if not provided
        if not otp_code:
            otp_code = f"{random.randint(100000, 999999)}"

        otp_key = cls.get_otp_key(portal_name, email)
        
        # 1. Overwrite Rule: cache.set() implicitly expires previous keys for this entity
        ttl = 300  # 5 minutes
        expiration = time.time() + ttl
        # Store as a tuple: (code, invalid_attempts, expiration_timestamp)
        cache.set(otp_key, (otp_code, 0, expiration), timeout=ttl)
        
        # 2. Rate Limiting Rule: Set 60-second TTL lock
        cache.set(lock_key, True, timeout=60)
        
        return {"status": "success", "otp_code": otp_code}

    @classmethod
    def verify_otp(cls, portal_name, email, code_input):
        """
        Verifies the user input OTP code.
        """
        otp_key = cls.get_otp_key(portal_name, email)
        cached_data = cache.get(otp_key)
        
        if not cached_data:
            return {"status": "invalid", "message": "OTP expired or not found."}
            
        otp_code, attempts, expiration = cached_data
        
        if code_input == otp_code:
            # Successful verification -> invalidate/delete OTP cache immediately
            cache.delete(otp_key)
            # Set verified token for 2 minutes to allow password reset
            verified_key = cls.get_verified_key(portal_name, email)
            cache.set(verified_key, True, timeout=120)
            return {"status": "verified"}
            
        # Failed verification -> Increment invalid attempts counter
        attempts += 1
        
        # 3. Brute-Force Shield: If attempts reach exactly 5, delete the cached object
        if attempts >= 5:
            cache.delete(otp_key)
            return {
                "status": "blocked",
                "message": "Too many failed attempts. OTP has been invalidated.",
            }
            
        # Re-save with remaining TTL
        remaining_ttl = int(expiration - time.time())
        if remaining_ttl > 0:
            cache.set(otp_key, (otp_code, attempts, expiration), timeout=remaining_ttl)
            
        return {
            "status": "invalid",
            "message": f"Invalid OTP. {5 - attempts} attempts remaining.",
        }

    @classmethod
    def consume_verification(cls, portal_name, email):
        """
        Consumes the verified transient token.
        """
        verified_key = cls.get_verified_key(portal_name, email)
        if cache.get(verified_key):
            cache.delete(verified_key)
            return True
        return False
