// src/modules/auth/oauth.controller.js
import { OAuthService } from "./oauth.service.js";

export const OAuthController = {
  loginWithProvider: async (req, res) => {
    try {
      const { provider, id_token } = req.body;
      const userData = await OAuthService.getUserFromProvider(provider, id_token);
      const user = await OAuthService.createOrUpdateUser(userData);
      const token = await OAuthService.generateJWT(user);

      res.status(200).json({ token, user });
    } catch (err) {
      if (err.message == "Provider não suportado"){
        return res.status(400).json({message: err.message})
      }
      res.status(500).json({ msg: "Erro no login OAuth", error: err.message });
    }
  },
};
